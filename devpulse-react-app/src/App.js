// src/App.js

import React, { useState, useEffect } from "react";
import { db } from "./firebase/firebase"; // Adjust path if needed
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy,
    // serverTimestamp  (for more accurate time data)
} from "firebase/firestore";

function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Function to fetch data from Firestore
  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Query the 'sessions' collection, ordered by start time
      const q = query(collection(db, "sessions"), orderBy("startTime", "desc"));
      const querySnapshot = await getDocs(q);
      
      const sessionData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        // Firestore TimeStamp needs conversion to JavaScript Date object
        startTime: doc.data().startTime && doc.data().startTime.toDate 
               ? doc.data().startTime.toDate() 
               : new Date(), 
  ...doc.data()
      }));
      setSessions(sessionData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
    setLoading(false);
  };

  // 2. Function to add dummy data (for testing)
  const addTestSession = async () => {
    try {
      await addDoc(collection(db, "sessions"), {
        userId: "test_user_1",
        startTime: new Date(),
        durationMinutes: 30, // Example duration
        type: "coding" // Example type
      });
      alert("Test session added!");
      fetchSessions(); // Refresh the list
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // 3. Load data when component mounts
  useEffect(() => {
    fetchSessions();
  }, []);

  // Simple Styling for display
  const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial' };
  const cardStyle = { padding: '15px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  
  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#2563eb', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>DevPulse Dashboard</h1>
      
      <button 
        onClick={addTestSession}
        style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', margin: '10px 0' }}
      >
        + Add Test Session (Click Me!)
      </button>

      <h2>Recent Sessions ({sessions.length})</h2>
      
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div>
          {sessions.length === 0 ? (
            <p style={{ color: '#777' }}>No sessions logged yet. Use the button above or the VS Code extension to log one.</p>
          ) : (
            <div>
              {sessions.map((session) => (
                <div key={session.id} style={cardStyle}>
                  <div>
                    <strong style={{ textTransform: 'capitalize' }}>{session.type} Session</strong>
                    <p style={{ fontSize: '0.8em', color: '#555' }}>
                       {session.startTime ? session.startTime.toLocaleString() : 'Time not recorded'}
                    </p>
                  </div>
                  <span style={{ backgroundColor: session.type === 'coding' ? '#dcfce7' : '#fee2e2', color: session.type === 'coding' ? '#16a34a' : '#ef4444', padding: '5px 10px', borderRadius: '15px', fontWeight: 'bold' }}>
                    {session.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;