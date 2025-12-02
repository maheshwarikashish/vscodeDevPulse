import React, { useState, useEffect } from "react";
// Firebase Imports
import { db } from "./firebase/firebase";
import { 
    collection, 
    addDoc, 
    query, 
    orderBy,
    onSnapshot 
} from "firebase/firestore";

// Charting Imports
import { Bar } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend 
} from 'chart.js';

// Data Processor Import (Assuming you created src/utils/dataProcessor.js)
import { calculateDailyMetrics } from './utils/dataProcessor';

// Register Chart.js components globally
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Utility Function to Add Test Data ---
  const addTestSession = async () => {
    try {
      await addDoc(collection(db, "sessions"), {
        userId: "test_user_1",
        // Using Firestore timestamp for proper sorting
        startTime: new Date(), 
        durationMinutes: Math.floor(Math.random() * 60) + 10, 
        type: Math.random() > 0.7 ? "break" : "coding" 
      });
      console.log("Test session added!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // --- Real-Time Data Fetching with onSnapshot ---
  useEffect(() => {
    setLoading(true);
    
    // Create the query: sessions ordered by startTime (newest first)
    // NOTE: If you run into "missing index" errors later, remove orderBy()
    const q = query(collection(db, "sessions"), orderBy("startTime", "desc"));

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessionData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        // Convert Firestore TimeStamp to a JavaScript Date object
        startTime: doc.data().startTime && doc.data().startTime.toDate 
                    ? doc.data().startTime.toDate() 
                    : new Date(), 
        ...doc.data()
      }));
      
      setSessions(sessionData);
      setLoading(false);
    }, 
    (error) => {
        console.error("Error receiving real-time updates:", error);
        setLoading(false);
    });

    // Cleanup: Stop the listener when the component unmounts
    return () => unsubscribe();
  }, []); 

  // --- Data Processing for Visualization ---
  const dailyMetrics = calculateDailyMetrics(sessions);
  const chartLabels = Object.keys(dailyMetrics).sort();
  const codingData = chartLabels.map(date => dailyMetrics[date].coding);
  const breakData = chartLabels.map(date => dailyMetrics[date].break);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Coding Minutes',
        data: codingData,
        backgroundColor: '#2563eb', // Blue
      },
      {
        label: 'Break Minutes',
        data: breakData,
        backgroundColor: '#ef4444', // Red
      },
    ],
  };

  // --- Styling for the UI ---
  const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Inter, Arial', backgroundColor: '#f9fafb', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
  const cardStyle = { 
      padding: '15px', 
      margin: '10px 0', 
      borderLeft: '4px solid #3b82f6', 
      borderRadius: '5px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  };
  const buttonStyle = { 
    backgroundColor: '#3b82f6', 
    color: 'white', 
    padding: '10px 15px', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    border: 'none', 
    margin: '10px 0',
    fontWeight: 'bold'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#1d4ed8', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>
          DevPulse Dashboard
      </h1>
      
      <button 
        onClick={addTestSession}
        style={buttonStyle}
      >
        + Add Test Session (Real-Time Test)
      </button>

      {/* --- Daily Activity Chart --- */}
      <h2 style={{marginTop: '30px', color: '#1f2937'}}>Daily Activity Trends</h2>
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff' }}>
          {loading ? (
              <p>Preparing visualization...</p>
          ) : sessions.length > 0 ? (
              <Bar 
                  data={chartData} 
                  options={{ 
                      responsive: true, 
                      scales: { 
                          x: { stacked: true }, 
                          y: { stacked: true, title: { display: true, text: 'Minutes' } } 
                      }, 
                      plugins: { 
                          title: { display: true, text: 'Coding and Break Time Breakdown' },
                          legend: { position: 'top' } 
                      } 
                  }} 
              />
          ) : (
              <p>Click "Add Test Session" to generate data for the chart.</p>
          )}
      </div>
      
      {/* --- Recent Sessions List --- */}
      <h2 style={{ color: '#1f2937' }}>Recent Sessions ({sessions.length})</h2>
      
      {loading ? (
        <p>Loading session history...</p>
      ) : (
        <div>
          {sessions.length === 0 ? (
            <p style={{ color: '#777' }}>No sessions logged yet. Use the button above!</p>
          ) : (
            <div>
              {sessions.map((session) => (
                <div key={session.id} style={cardStyle}>
                  <div>
                    <strong style={{ textTransform: 'capitalize', color: '#1f2937' }}>
                        {session.type} Session
                    </strong>
                    <p style={{ fontSize: '0.8em', color: '#6b7280' }}>
                       {session.startTime ? session.startTime.toLocaleString() : 'Time not recorded'}
                    </p>
                  </div>
                  <span style={{ 
                      backgroundColor: session.type === 'coding' ? '#d1fae5' : '#fee2e2', 
                      color: session.type === 'coding' ? '#059669' : '#dc2626', 
                      padding: '8px 12px', 
                      borderRadius: '20px', 
                      fontWeight: 'bold',
                      fontSize: '0.9em'
                    }}>
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