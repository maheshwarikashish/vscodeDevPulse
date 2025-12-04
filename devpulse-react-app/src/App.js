// src/App.js
import React, { useState, useEffect } from "react";
import { auth } from "./firebase/firebase"; // Adjust path if needed
import {
  onAuthStateChanged, signOut
} from "firebase/auth";
import Auth from './Auth'; // Import the Auth component
import Dashboard from './Dashboard'; // Import the new Dashboard component

function App() {
  const [user, setUser] = useState(null); // New state for user

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial', color: '#333' };
   
  return (
    <div style={containerStyle}>
      {/* <h1 style={{ color: '#2563eb', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>DevPulse Dashboard</h1> */} 
      
      {!user ? (
        <Auth />
      ) : (
        <>
          <p>Welcome, {user.email}!</p>
          <button 
            onClick={() => signOut(auth)}
            style={{ backgroundColor: '#ef4444', color: 'white', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', margin: '10px 0', fontSize: '16px' }}
          >
            Sign Out
          </button>
          <Dashboard user={user} />
        </>
      )}
    </div>
  );
}

export default App;
