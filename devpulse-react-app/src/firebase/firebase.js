import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// REPLACE THIS WITH YOUR CONFIG OBJECT FROM PHASE 1
const firebaseConfig = {
  apiKey: "AIzaSyAFwmNxzZKvZiKL9GkP0unqrL8vjOR_6Rw",
  authDomain: "code-45577.firebaseapp.com",
  projectId: "code-45577",
  storageBucket: "code-45577.firebasestorage.app",
  messagingSenderId: "212800166176",
  appId: "1:212800166176:web:04a40b82ae1eb0b7fe1f45"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, doc, setDoc, getDoc };

// If REACT_APP_FIRESTORE_EMULATOR_HOST is set, connect the web app to the emulator
// Example value: "localhost:8080"
if (process.env.REACT_APP_FIRESTORE_EMULATOR_HOST) {
  try {
    const [host, portStr] = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST.split(':');
    const port = parseInt(portStr, 10) || 8080;
    connectFirestoreEmulator(db, host, port);
    console.log('[DevPulse Web] Connected to Firestore emulator at', process.env.REACT_APP_FIRESTORE_EMULATOR_HOST);
  } catch (e) {
    console.warn('[DevPulse Web] Failed to connect to Firestore emulator:', e);
  }
}