<script>
    import { customAlphabet } from 'nanoid'
    const nanoid = customAlphabet('1234567890'+'abcdefghijklmnopqrstuvwxyz'.toUpperCase(), 8)

    const start = () => {
        let room = nanoid();
        window.location.href = window.location + room;
    };
</script>

<div class="flex flex-col items-center justify-center">
    <h1 class="text-4xl font-bold">Telemotion</h1>
    <h2 class="text-2xl mt-5">Telematic control for music installation with motions.</h2>
    <button class="func bg-green-400 hover:bg-green-200 mt-10" id="startButton" on:click="{start}">New session</button>
</div>