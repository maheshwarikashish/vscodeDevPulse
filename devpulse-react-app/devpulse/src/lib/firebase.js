// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR CONFIG OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyAFwmNxzZKvZiKL9GkP0unqrL8vjOR_6Rw",
  authDomain: "code-45577.firebaseapp.com",
  projectId: "code-45577",
  storageBucket: "code-45577.firebasestorage.app",
  messagingSenderId: "212800166176",
  appId: "1:212800166176:web:04a40b82ae1eb0b7fe1f45"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };