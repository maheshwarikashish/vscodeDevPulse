// src/extension.ts
import * as vscode from 'vscode';

import {
    db,
    collection,
    addDoc,
    serverTimestamp,
    testWrite,
    auth,
    GithubAuthProvider,
    signInWithCredential
} from './firebase-extension';

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

// ---------------- GLOBAL STATE ----------------

let sessionStartTime: Date | null = null;
let currentUser: User | null = null;

// ---------------- FIREBASE SESSION LOGGING ----------------

async function logSessionToFirebase(
    durationMinutes: number,
    sessionType: 'coding' | 'break'
) {
    if (!currentUser) {
        vscode.window.showWarningMessage('DevPulse: Please sign in first.');
        return;
    }

    if (durationMinutes <= 0) return;

    try {
        await addDoc(collection(db, 'sessions'), {
            userId: currentUser.uid,
            durationMinutes,
            sessionType,
            createdAt: serverTimestamp()
        });

        vscode.window.showInformationMessage(
            `DevPulse: Logged ${Math.round(durationMinutes)} min ${sessionType}`
        );
    } catch (err) {
        console.error('[DevPulse] Firestore error:', err);
        vscode.window.showErrorMessage('DevPulse: Failed to log session.');
    }
}

// ---------------- COMMAND HANDLERS ----------------

function handleStartSession() {
    sessionStartTime = new Date();
    vscode.window.showInformationMessage('DevPulse: Coding session started');
}

async function handleEndSession() {
    if (!sessionStartTime) {
        vscode.window.showWarningMessage('DevPulse: No active session');
        return;
    }

    const duration =
        (Date.now() - sessionStartTime.getTime()) / (1000 * 60);

    sessionStartTime = null;
    await logSessionToFirebase(duration, 'coding');
}

async function handleLogBreak() {
    const input = await vscode.window.showInputBox({
        prompt: 'Break duration (minutes)',
        validateInput: v =>
            isNaN(Number(v)) ? 'Enter a valid number' : null
    });

    if (input) {
        await logSessionToFirebase(Number(input), 'break');
    }
}

// ---------------- EXTENSION ACTIVATION ----------------

export function activate(context: vscode.ExtensionContext) {
    console.log('[DevPulse] Extension Activated');

    // 🔐 Listen to Firebase auth state
    onAuthStateChanged(auth, user => {
        currentUser = user;

        if (user) {
            vscode.window.showInformationMessage(
                `DevPulse: Signed in as ${user.email || user.displayName}`
            );
        } else {
            vscode.window.showInformationMessage('DevPulse: Signed out');
        }
    });

    // ---------------- COMMAND REGISTRATION ----------------

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'devpulse.startSession',
            handleStartSession
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'devpulse.endSession',
            handleEndSession
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'devpulse.logBreak',
            handleLogBreak
        )
    );

    // -------- EMAIL + PASSWORD LOGIN --------

    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.signIn', async () => {
            const email = await vscode.window.showInputBox({
                prompt: 'Firebase Email'
            });

            const password = await vscode.window.showInputBox({
                prompt: 'Firebase Password',
                password: true
            });

            if (!email || !password) return;

            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err: any) {
                vscode.window.showErrorMessage(err.message);
            }
        })
    );

    // -------- SIGN OUT --------

    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.signOut', async () => {
            await signOut(auth);
        })
    );

    // -------- ✅ CORRECT GITHUB LOGIN (VS CODE WAY) --------

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'devpulse.signInWithGitHub',
            async () => {
                try {
                    // 1️⃣ Get GitHub session from VS Code
                    const session =
                        await vscode.authentication.getSession(
                            'github',
                            ['read:user', 'user:email'],
                            { createIfNone: true }
                        );

                    // 2️⃣ Convert token → Firebase credential
                    const credential =
                        GithubAuthProvider.credential(
                            session.accessToken
                        );

                    // 3️⃣ Login to Firebase
                    const result = await signInWithCredential(
                        auth,
                        credential
                    );

                    vscode.window.showInformationMessage(
                        `DevPulse: GitHub login success (${result.user.displayName || result.user.email})`
                    );
                } catch (err: any) {
                    console.error('[DevPulse] GitHub login error:', err);
                    vscode.window.showErrorMessage(
                        'DevPulse: GitHub sign-in failed'
                    );
                }
            }
        )
    );

    // -------- FIRESTORE DIAGNOSTIC --------

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'devpulse.testFirestore',
            async () => {
                const result = await testWrite();
                vscode.window.showInformationMessage(
                    result?.success
                        ? 'DevPulse: Firestore OK'
                        : 'DevPulse: Firestore FAILED'
                );
            }
        )
    );
}

export function deactivate() {}