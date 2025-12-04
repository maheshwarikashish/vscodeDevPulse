import React, { useState } from 'react';
import { auth } from './firebase/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      setError('');
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signed up successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
      alert('Signed in successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      setError('');
      await signOut(auth);
      alert('Signed out successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Authentication</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleSignIn}>Sign In</button>
      <button onClick={handleSignOut}>Sign Out</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Auth;

