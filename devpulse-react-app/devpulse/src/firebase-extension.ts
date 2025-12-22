// firebase-extension.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection as fbCollection, addDoc as fbAddDoc, serverTimestamp as fbServerTimestamp, connectFirestoreEmulator as fbConnectEmulator } from "firebase/firestore";
// IMPORTANT: Import all Auth functions you want to use/export
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, GithubAuthProvider, signInWithCredential, signInWithCustomToken, signInWithPopup } from "firebase/auth";

// REPLACE WITH YOUR CONFIG OBJECT FROM PHASE 1
const firebaseConfig = {
  apiKey: "AIzaSyAFwmNxzZKvZiKL9GkP0unqrL8vjOR_6Rw",
  authDomain: "code-45577.firebaseapp.com",
  projectId: "code-45577",
  storageBucket: "code-45577.firebasestorage.app",
  messagingSenderId: "212800166176",
  appId: "1:212800166176:web:04a40b82ae1eb0b77fe1f45"
};

// Decide whether the config looks real or still placeholder values.
const configIsPlaceholder = Object.values(firebaseConfig).some((v) => typeof v === 'string' && v.includes('...'));

// Initialize Firebase safely.
let db: any = null;
let auth: any = null; // Declare auth variable
if (configIsPlaceholder) {
  console.log('[DevPulse] Firebase config looks like a placeholder — skipping initialization for safety');
  db = null;
  auth = null; // Set auth to null as well
} else {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app); // Initialize Firebase Auth

    // If an emulator host is provided in the environment, connect to the local emulator
    try {
      const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR || null;
      if (emulatorHost) {
        // emulatorHost is typically "host:port" e.g. "localhost:8080"
        const [host, portStr] = emulatorHost.split(':');
        const port = parseInt(portStr, 10) || 8080;
        fbConnectEmulator(db, host, port);
        console.log('[DevPulse] Connected to Firestore emulator at', emulatorHost);
      }
    } catch (e) {
      console.warn('[DevPulse] Could not connect to Firestore emulator:', e);
    }

    console.log('[DevPulse] Firebase initialized successfully');
  } catch (err) {
    // Fail gracefully — don't throw during module load so activation can continue
    console.error('[DevPulse] Firebase initialization failed:', err);
    db = null;
    auth = null; // Set auth to null on error
  }
}

// Safe wrappers exported so the extension can import the same names even when Firebase is not available
function collection(dbArg: any, path: string) {
  if (!db) {
    // return a lightweight stub that downstream code can pass to addDoc stub
    return { __devpulse_stub_collection: true, path };
  }
  return fbCollection(dbArg, path);
}

async function addDoc(colRef: any, data: any) {
  if (!db) {
    console.warn('[DevPulse] addDoc called but Firebase is not initialized — skipping network call.');
    return Promise.resolve(null);
  }

  // Wrap the Firestore addDoc with a short timeout so failing network calls (permissions,
  // missing API, etc.) don't hang activation/tests forever. If the write doesn't complete
  // within `WRITE_TIMEOUT_MS`, resolve with null and log a warning.
  const WRITE_TIMEOUT_MS = 3000;
  const writePromise = fbAddDoc(colRef, data);
  const timeoutPromise = new Promise((res) => {
    setTimeout(() => {
      console.warn('[DevPulse] Firestore write timed out — continuing without blocking.');
      res(null);
    }, WRITE_TIMEOUT_MS);
  });

  // Promise.race ensures we return whichever completes first.
  return Promise.race([writePromise, timeoutPromise]);
}

function serverTimestamp() {
  if (!db) {
    // fallback to client timestamp for development/logging
    return new Date();
  }
  return fbServerTimestamp();
}

// Re-exporting all necessary authentication methods
export { 
  db, 
  auth, 
  collection, 
  addDoc, 
  serverTimestamp, 
  GithubAuthProvider, 
  signInWithCredential, 
  signInWithCustomToken, 
  signInWithPopup,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
};

// Diagnostic helper: attempt a single test write and return structured result for debugging.
async function testWrite() {
  if (!db) {
    console.warn('[DevPulse] testWrite skipped: Firebase not initialized');
    return { skipped: true };
  }

  try {
    // Use the underlying fbAddDoc directly here (instead of the wrapped addDoc)
    // so we can return the created document's id/path for clearer diagnostics.
    const col = fbCollection(db, 'diagnostics');
    const res = await fbAddDoc(col, { ts: new Date().toISOString(), note: 'devpulse-diagnostic' });

    // DocumentReference from addDoc exposes `id` and `path` properties.
    const id = (res as any)?.id ?? null;
    const path = (res as any)?.path ?? null;

    return { success: true, id, path, result: res };
  } catch (err: any) {
    // Try to extract useful fields from the error
    const code = err?.code ?? err?.status ?? null;
    const message = err?.message ?? String(err);
    console.error('[DevPulse] testWrite error:', err);
    return { success: false, code, message, raw: err };
  }
}

export { testWrite };