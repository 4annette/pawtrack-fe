importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC09ZKkF49gXhveAcWxg3cE4VPGANSDBp8",
  projectId: "pawtrack-985f0",
  messagingSenderId: "963544825204",
  appId: "1:963544825204:web:24ae1447b186b270158021",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();