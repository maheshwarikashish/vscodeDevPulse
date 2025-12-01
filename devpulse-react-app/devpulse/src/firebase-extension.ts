// firebase-extension.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// REPLACE WITH YOUR CONFIG OBJECT FROM PHASE 1
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "devpulse-...",
  projectId: "devpulse-...",
  // ...other keys
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the functions we need
export { db, collection, addDoc, serverTimestamp };