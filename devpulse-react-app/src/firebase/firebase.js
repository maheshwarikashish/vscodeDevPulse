import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore";

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