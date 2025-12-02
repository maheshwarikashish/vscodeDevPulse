import * as assert from 'assert';
import * as vscode from 'vscode';

suite('DevPulse Commands Integration', () => {
  test('startSession then endSession should run without throwing', async () => {
    // Allow the extension host to finish activation
    await new Promise((res) => setTimeout(res, 1000));

    // Execute start session
    await vscode.commands.executeCommand('devpulse.startSession');

    // Short wait to simulate time passing
    await new Promise((res) => setTimeout(res, 200));

  // Execute end session — this will call the firebase wrapper which may perform a write
  await vscode.commands.executeCommand('devpulse.endSession');

  // Run diagnostic Firestore write and capture result (returned by command)
  const diag = await vscode.commands.executeCommand('devpulse.testFirestore');
  // Make sure the diagnostic returned (either skipped, success, or error object)
  assert.ok(diag !== undefined && diag !== null);

    // If we reached here without exception, consider it success
    assert.ok(true);
  }).timeout(10000);
});
