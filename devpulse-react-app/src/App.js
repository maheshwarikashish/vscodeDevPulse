// src/App.js
import React, { useState, useEffect } from "react";
import { db } from "./firebase/firebase"; // Adjust path if needed
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";

// Step 3: Add imports for charting
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { calculateDailyMetrics } from './utils/dataProcessor'; // Import the new processor

// Register Chart.js components that we will use
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Function to fetch data from Firestore
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "sessions"), orderBy("startTime", "desc"));
      const querySnapshot = await getDocs(q);
      
      // FIX: Correctly map the data and convert Timestamp to Date
      const sessionData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data, // Spread the original data
          id: doc.id, // Add the document ID
          // Overwrite startTime with a JS Date object
          startTime: data.startTime && data.startTime.toDate 
            ? data.startTime.toDate() 
            : new Date(),
        };
      });

      setSessions(sessionData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
    setLoading(false);
  };

  // 2. Function to add a random session for testing the chart
  const addTestSession = async () => {
    try {
      const types = ['coding', 'break'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomDuration = Math.floor(Math.random() * 120) + 15; // Random duration between 15 and 135 mins

      await addDoc(collection(db, "sessions"), {
        userId: "test_user_dashboard",
        startTime: serverTimestamp(), // Use server timestamp for consistency
        durationMinutes: randomDuration,
        type: randomType
      });
      fetchSessions(); // Refresh the list after adding
    } catch (e) {
      console.error("Error adding document: ", e);
      // Show a simple user-facing message in the UI for quick debugging
      window.alert('Failed to add test session. Check console for details.');
    }
  };

  // 3. Load data when component mounts
  useEffect(() => {
    fetchSessions();
  }, []);

  // --- Start of Chart Logic from Step 3 ---

  // Process data for charts
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
  
  const chartOptions = {
    responsive: true,
    scales: {
        x: { stacked: true },
        y: { stacked: true }
    },
    plugins: {
        legend: {
            position: 'top',
        }
    }
  };

  // --- End of Chart Logic ---

  // Simple Styling for display
  const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial', color: '#333' };
  const cardStyle = { padding: '15px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9' };
  
  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#2563eb', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>DevPulse Dashboard</h1>
      
      <button 
        onClick={addTestSession}
        style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', margin: '20px 0', fontSize: '16px' }}
      >
        + Add Random Test Session
      </button>

      <h2>Daily Activity Chart</h2>
      {/* Chart Component */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          {sessions.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
          ) : (
              <p>Click "Add Random Test Session" to generate data and see the chart!</p>
          )}
      </div>
      
      <h2>Recent Sessions ({sessions.length})</h2>
      
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div>
          {sessions.length === 0 ? (
            <p style={{ color: '#777' }}>No sessions logged yet.</p>
          ) : (
            <div>
              {sessions.map((session) => (
                <div key={session.id} style={cardStyle}>
                  <div>
                    <strong style={{ textTransform: 'capitalize' }}>{session.type} Session</strong>
                    <p style={{ fontSize: '0.9em', color: '#555' }}>
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
