// src/extension.ts
import * as vscode from 'vscode';
import { db, collection, addDoc, serverTimestamp } from './firebase-extension'; // UNCOMMENTED

// Global variable to track the start time of the current session
let sessionStartTime: Date | null = null;
const USER_ID = "static_user_123"; 

// REAL Firebase logging function
async function logSessionToFirebase(durationMinutes: number, sessionType: 'coding' | 'break') {
    if (durationMinutes <= 0) {
        console.warn(`[DevPulse] Attempted to log a session with zero or negative duration. Type: ${sessionType}`);
        return; // Don't log sessions with no duration
    }

    try {
        await addDoc(collection(db, "coding_sessions"), {
            userId: USER_ID,
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
    
    // Log success after registration
    console.log('--- DevPulse Commands Registered Successfully ---');
}

export function deactivate() {}