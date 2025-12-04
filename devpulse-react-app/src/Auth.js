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

  const containerStyle = {
    maxWidth: '400px',
    margin: '80px auto',
    padding: '30px',
    fontFamily: "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    color: '#333',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    textAlign: 'center'
  };

  const titleStyle = {
    color: '#1f2937',
    fontSize: '1.8em',
    fontWeight: '700',
    marginBottom: '25px',
  };

  const inputStyle = {
    width: 'calc(100% - 20px)',
    padding: '12px 10px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1em',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    fontSize: '1em',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    margin: '5px',
    minWidth: '100px',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white',
    '&:hover': { backgroundColor: '#1e40af' },
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    '&:hover': { backgroundColor: '#d1d5db' },
  };

  const errorStyle = {
    color: '#dc2626',
    marginTop: '15px',
    fontSize: '0.9em',
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Authentication</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <div>
        <button onClick={handleSignUp} style={primaryButtonStyle}>Sign Up</button>
        <button onClick={handleSignIn} style={primaryButtonStyle}>Sign In</button>
        {/* <button onClick={handleSignOut} style={secondaryButtonStyle}>Sign Out</button> */}
      </div>
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
};

export default Auth;

