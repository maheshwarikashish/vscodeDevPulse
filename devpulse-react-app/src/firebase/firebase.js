import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// REPLACE THIS WITH YOUR CONFIG OBJECT FROM PHASE 1
const firebaseConfig = {
  apiKey: "AIzaSyDgaCFid4IaE3sP2BUe4iTVZFi1LpijkeA",
  authDomain: "devpulse-735de.firebaseapp.com",
  projectId: "devpulse-735de",
  storageBucket: "devpulse-735de.firebasestorage.app",
  messagingSenderId: "1004389043770",
  appId: "1:1004389043770:web:2b0481ec9a1e7c46122f03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

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