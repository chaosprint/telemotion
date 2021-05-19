const servers = {
    iceServers: [
        {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

const firebaseConfig = {
    apiKey: "AIzaSyDJTZtCFWHTRfY0uXJgGK3R4iHGJNxgi-4",
    authDomain: "telemotion-alpha.firebaseapp.com",
    projectId: "telemotion-alpha",
    storageBucket: "telemotion-alpha.appspot.com",
    messagingSenderId: "368535764550",
    appId: "1:368535764550:web:6b285407565dc473235447",
    measurementId: "G-5M5PLLH5WN"
  };

export {servers, firebaseConfig}