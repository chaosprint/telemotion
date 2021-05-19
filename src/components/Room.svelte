<script>
    import NameTag from './NameTag.svelte'
    import  {servers, firebaseConfig} from '../utils/settings.js'
    import  {difference, differenceAccuracy, getColumnQoM} from '../utils/helpers.js'
    import {onMount} from 'svelte'
    import firebase from 'firebase/app';
    import 'firebase/firestore';
    import * as Tone from 'tone' // TODO: replace this with Glicol

    // firebase routine job
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const firestore = firebase.firestore();

    let midiOutput = null;
    let isGuest = true;
    let loc = ""
    let promise;

    // webrtc begins
    const pc = new RTCPeerConnection(servers);
    let localStream = null;
    let remoteStream = new MediaStream();

    // tone js for testing, one line, that's all
    const synth = new Tone.MembraneSynth().toDestination();

    // frame differencing algorithm
    const setup = (target) => {
        var contextSource = document.getElementById("canvas-source").getContext('2d');
        var contextBlended = document.getElementById("canvas-blended").getContext('2d');
        let lastImageData;
        var socket;
        if (target === "remoteVideo" && window.io !== undefined) {
            socket = window.io('http://127.0.0.1:8081');
            socket.on('connect', function() {
                    // sends to socket.io server the host/port of oscServer
                    // and oscClient
                    socket.emit('config',
                        {
                            server: {
                                port: 3333,
                                host: '127.0.0.1'
                            },
                            client: {
                                port: 3334,
                                host: '127.0.0.1'
                            }
                        }
                    );
            });
        }

        // calculate the frame difference and draw the canvas
        function renderCanvas() {
            setTimeout(()=>{
                let qom = [0, 0, 0, 0]
                let video = document.getElementById(target) // depend on whether you are host or guest
                contextSource.drawImage(video, 0, 0, 640, 360);

                var width = 640
                var height = 360
                // get webcam image data
                var sourceData = contextSource.getImageData(0, 0, 640, 360);
                // create an image if the previous image doesn’t exist
                if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
                // create a ImageData instance to receive the blended result
                var blendedData = contextSource.createImageData(width, height);
                // blend the 2 images, two options
                differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
                // difference(blendedData.data, sourceData.data, lastImageData.data);
                getColumnQoM(sourceData.data, lastImageData.data, qom, 640)
                
                if (socket !== undefined) {socket.emit('message', String(qom))}
                
                // draw the result in a canvas
                contextBlended.putImageData(blendedData, 0, 0);
                // store the current webcam image
                lastImageData = sourceData;

                if (target === "remoteVideo") {
                    for (var r=0; r<8; ++r) {
                        var blendedData = contextBlended.getImageData(1/8*r*640, 0, 640/8, 100);
                        var i = 0;
                        var average = 0;
                        // loop over the pixels
                        while (i < (blendedData.data.length * 0.25)) {
                            // make an average between the color channel
                            average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
                            ++i;
                        }
                        // calculate an average between of the color values of the note area
                        average = Math.round(average / (blendedData.data.length * 0.25));
                        if (average > 10) {
                            if (midiOutput) {
                                midiOutput.forEach(e => {
                                    let midi = Math.floor(Math.random()*10+60);
                                    synth.triggerAttackRelease(Tone.Midi(midi).toNote(), "16n");
                                    e.send([144, midi, Math.floor(Math.random()*30+60)]);
                                    console.log(`Sent midi note ${midi} to ${e}`)
                                });
                            }
                        }
                    }
                }
            }, 1000/1);
                
            window.requestAnimationFrame(renderCanvas);
        }
        window.requestAnimationFrame(renderCanvas);
    }

    // this is the function that asks for the webcam access
    // and get ready for the comming connection

    // also for midi device open
    const open = async () => {

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
        };

        document.getElementById("localVideo").srcObject = localStream;
        document.getElementById("remoteVideo").srcObject = remoteStream;

        // for midi
        navigator.requestMIDIAccess()
        .then(function(midiAccess) {
            const outputs = Array.from(midiAccess.outputs.values());
            midiOutput = outputs
            console.log(outputs);
            // for(const output of outputs) {
            //     console.log(output);
            //     midiOutput = output;
            // }
        });
    }

    const offer = async () => {

        await open();
        setup("remoteVideo")
        const callDoc = firestore.collection('calls').doc(room);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');

        pc.onicecandidate = event => {
            event.candidate && offerCandidates.add(event.candidate.toJSON());
        };
        // Create offer
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await callDoc.set({ offer });
        // Listen for remote answer
        callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });

        // Listen for remote ICE candidates
        answerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
            });
        });
    }

    const answer = async () => {
        await open()
        setup("localVideo")
        const callId = room;
        const callDoc = firestore.collection('calls').doc(callId);
        const offerCandidates = callDoc.collection('offerCandidates');
        const answerCandidates = callDoc.collection('answerCandidates');
        pc.onicecandidate = event => {
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        };
        // Fetch data, then set the offer & answer
        const callData = (await callDoc.get()).data();

        const offerDescription = callData.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await callDoc.update({ answer });

        offerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
            console.log(change)
            if (change.type === 'added') {
                let data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
            });
        });

    }

    // when entering the room, if the uuid does not exist in the signaling server
    // it means that it is the host who is entering
    // we need to make an offer
    // else, we assum that the host is already there, make connection for the guest
    onMount(()=>{
        const usersRef = firestore.collection('calls').doc(room);
        promise = usersRef.get()
        .then((docSnapshot) => {
            if (docSnapshot.exists) {
                isGuest = true
                console.log("answer")
                answer();
            } else {
                isGuest = false
                loc = window.location.href;
                offer()
            }
        });
    })

    const copy = () => {
        var copyText = document.getElementById("callInput");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand("copy");
        copyState = "COPIED!"
        console.log("Link copied!");
    };
    let copyState = "COPY";
    export let room;
</script>

<div class="flex flex-col justify-center items-center">
    {#await promise then _}
    {#if !isGuest}
        <p>Open your camera and microphone for the installation. Share the link (currently limited to one). The guest can use motion to send MIDI notes to your installation.</p>
        <div>
        <input id="callInput" class="focus:outline-none bg-gray-100 my-2 p-2 w-96"
        bind:value={loc}/>
        <button class="py-1 px-3 text-indigo-300 bg-gray-100 rounded-full border-2 border-indigo-300 focus:outline-none"
            on:click={copy}
        >{copyState}</button>
        </div>
    {:else}
        <p>Move more to reach a threshold and then a random MIDI note will be played in the remote installtion.</p>
    {/if}
    {/await}
    <div class="grid grid-cols-2 grid-rows-2">
    <div class=""><NameTag name="Local"/><video class="area" id="localVideo" autoplay playsinline><track kind="captions"></video></div>
    <div class=""><NameTag name="Remote"/><video class="area" id="remoteVideo" autoplay playsinline><track kind="captions"></video></div>
    <div class=""><NameTag name="Preprocess"/><canvas id="canvas-source" class="area" width="640" height="360"></canvas></div>
    <div class=""><NameTag name="Frame Difference"/><canvas id="canvas-blended" class="area" width="640" height="360"></canvas></div>
    </div>
</div>

<style>
    .area{
        width:640px;
        height:360px;
    }
</style>