// src/extension.ts
import * as vscode from 'vscode';
import { db, collection, addDoc, serverTimestamp, testWrite, auth } from './firebase-extension'; // consolidated import
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
// Global variable to track the start time of the current session
let sessionStartTime: Date | null = null;
// let USER_ID = "static_user_123"; // No longer needed as we'll use authenticated user
let currentUser: User | null = null; // Track authenticated user

// REAL Firebase logging function
async function logSessionToFirebase(durationMinutes: number, sessionType: 'coding' | 'break') {
    if (!currentUser) {
        vscode.window.showWarningMessage('DevPulse: Please sign in to log sessions.');
        return;
    }
    if (durationMinutes <= 0) {
        console.warn(`[DevPulse] Attempted to log a session with zero or negative duration. Type: ${sessionType}`);
        return; // Don't log sessions with no duration
    }

    try {
        await addDoc(collection(db, "sessions"), {
            userId: currentUser.uid, // Use authenticated user's UID
            startTime: serverTimestamp(), // Use server time for consistency
            durationMinutes: durationMinutes,
            sessionType: sessionType
        });

        // Use a more specific success message
        if (sessionType === 'coding') {
             vscode.window.showInformationMessage(`DevPulse: Logged a ${Math.round(durationMinutes)} min coding session!`);
        } else {
             vscode.window.showInformationMessage(`DevPulse: Logged a ${durationMinutes} min break session!`);
        }

    } catch (error) {
        console.error("Firebase: ", error); // Log the full error to the debug console
        // Show a more generic but clear error message to the user
        vscode.window.showErrorMessage(`DevPulse: Failed to log session. Check the Debug Console for Firebase errors.`);
    }
}


// Command Handlers (Functions that run when commands are executed)

function handleStartSession() {
    sessionStartTime = new Date();
    vscode.window.showInformationMessage('DevPulse: Coding session started!');
}

async function handleEndSession() {
    if (!sessionStartTime) {
        vscode.window.showWarningMessage('DevPulse: No active session to end.');
        return;
    }
    const endTime = new Date();
    const durationMs = endTime.getTime() - sessionStartTime.getTime();
    const durationMinutes = durationMs / (1000 * 60); // Convert milliseconds to minutes

    await logSessionToFirebase(durationMinutes, 'coding');

    sessionStartTime = null; // Reset for the next session
}

async function handleLogBreak() {
    const durationStr = await vscode.window.showInputBox({
        prompt: "How many minutes was your break?",
        placeHolder: "Enter break duration in minutes",
        validateInput: text => {
            return isNaN(parseInt(text, 10)) ? 'Please enter a valid number.' : null;
        }
    });

    if (durationStr) {
        const duration = parseInt(durationStr, 10);
        await logSessionToFirebase(duration, 'break');
    }
}


// --- THE CRITICAL ACTIVATION FUNCTION ---
export function activate(context: vscode.ExtensionContext) {
    // This message confirms the activation process started
    console.log('--- DevPulse Extension Activation Attempted ---');
    const out = vscode.window.createOutputChannel('DevPulse');
    out.appendLine('--- DevPulse Extension Activation Attempted ---');

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            console.log('[DevPulse] User signed in:', user.email);
            vscode.window.showInformationMessage(`DevPulse: Signed in as ${user.email}`);
        } else {
            console.log('[DevPulse] User signed out');
            vscode.window.showInformationMessage('DevPulse: Signed out');
        }
    });

    // 1. Register the Start Session command
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.startSession', handleStartSession)
    );

    // 2. Register the End Session command
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.endSession', handleEndSession)
    );

    // 3. Register the Log Break command
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.logBreak', handleLogBreak)
    );

    // New command for signing in
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.signIn', async () => {
            const email = await vscode.window.showInputBox({ prompt: "Enter your Firebase email" });
            const password = await vscode.window.showInputBox({ prompt: "Enter your Firebase password", password: true });

            if (email && password) {
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    // currentUser will be set by onAuthStateChanged listener
                } catch (error: any) {
                    vscode.window.showErrorMessage(`DevPulse Sign-in failed: ${error.message}`);
                }
            }
        })
    );

    // New command for signing out
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.signOut', async () => {
            try {
                await signOut(auth);
                // currentUser will be set to null by onAuthStateChanged listener
            } catch (error: any) {
                vscode.window.showErrorMessage(`DevPulse Sign-out failed: ${error.message}`);
            }
        })
    );

    // 4. Register a diagnostic command to test Firestore writes (returns structured result)
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.testFirestore', async () => {
            const result = await testWrite();

            // Safe stringify to surface structured diagnostic info in logs
            try {
                const safe = JSON.stringify(result, Object.getOwnPropertyNames(result), 2);
                console.log('[DevPulse] Firestore diagnostic result:', safe);
            } catch (e) {
                console.log('[DevPulse] Firestore diagnostic result (non-serializable):', String(result));
            }

            if (result && result.success) {
                vscode.window.showInformationMessage('DevPulse: Firestore test write succeeded');
            } else if (result && result.skipped) {
                vscode.window.showWarningMessage('DevPulse: Firestore test skipped (not initialized)');
            } else {
                console.error('[DevPulse] Firestore diagnostic failed:', result);
                vscode.window.showErrorMessage(`DevPulse: Firestore diagnostic failed: ${result?.message ?? 'unknown'}`);
            }
            return result;
        })
    );
    
    // Log success after registration
    console.log('--- DevPulse Commands Registered Successfully ---');
    out.appendLine('--- DevPulse Commands Registered Successfully ---');
}

export function deactivate() {}