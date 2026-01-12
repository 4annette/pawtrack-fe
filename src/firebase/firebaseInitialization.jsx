import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC09ZKkF49gXhveAcWxg3cE4VPGANSDBp8",
  authDomain: "pawtrack-985f0.firebaseapp.com",
  projectId: "pawtrack-985f0",
  storageBucket: "pawtrack-985f0.firebasestorage.app",
  messagingSenderId: "963544825204",
  appId: "1:963544825204:web:24ae1447b186b270158021",
  measurementId: "G-0KF4H9P1E3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const messaging = getMessaging(app);
export { app, analytics, auth, db, messaging };