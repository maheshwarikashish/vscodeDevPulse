// src/extension.ts
import * as vscode from 'vscode';
// import { db, collection, addDoc, serverTimestamp } from './firebase-extension'; // Still commented out

// Global variable to track the start time of the current session
let sessionStartTime: Date | null = null;
const USER_ID = "static_user_123"; 

// Temporary function to simulate logging
async function logSessionToFirebase(durationMinutes: number, sessionType: 'coding' | 'break') {
    // This will show a message confirming the command worked
    vscode.window.showInformationMessage(`DevPulse: FAKE LOG - Command Worked! Logged a ${durationMinutes} min ${sessionType} session!`);
    console.log(`[DevPulse Log] Command worked. Type: ${sessionType}`);
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
    // Fake calculation
    const durationMinutes = 5; 
    await logSessionToFirebase(durationMinutes, 'coding');
    sessionStartTime = null;
}

async function handleLogBreak() {
    const duration = 15; // Hardcoded for simple testing
    await logSessionToFirebase(duration, 'break');
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