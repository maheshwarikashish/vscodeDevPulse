import React, { useState, useEffect } from "react";
import { db } from "./firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  doc, setDoc, getDoc // Import Firestore functions
} from "firebase/firestore";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, ScatterController } from 'chart.js';
import { calculateDailyMetrics, isToday, isThisWeek, calculateStreaks } from './utils/dataProcessor'; // Import the new helpers
import { fetchCommits } from './utils/githubApi'; // Import fetchCommits

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, ScatterController);

const Dashboard = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState('all'); // 'all', 'today', 'thisWeek'
  const [githubUsername, setGithubUsername] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  // Function to load GitHub config from Firestore
  const loadGithubConfig = async (uid) => {
    if (!uid) return;
    try {
      const userConfigRef = doc(db, "userConfigs", uid);
      const docSnap = await getDoc(userConfigRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGithubUsername(data.githubUsername || '');
        setGithubRepo(data.githubRepo || '');
      }
    } catch (error) {
      console.error("Error loading GitHub config:", error);
    }
  };

  // Function to save GitHub config to Firestore
  const saveGithubConfig = async () => {
    if (!user) return;
    try {
      const userConfigRef = doc(db, "userConfigs", user.uid);
      await setDoc(userConfigRef, {
        githubUsername: githubUsername,
        githubRepo: githubRepo,
      }, { merge: true }); // Use merge: true to avoid overwriting other fields
      alert('GitHub configuration saved!');
    } catch (error) {
      console.error("Error saving GitHub config:", error);
      alert('Failed to save GitHub configuration.');
    }
  };

  const fetchSessions = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      const q = query(collection(db, "sessions"), where("userId", "==", uid), orderBy("startTime", "desc"));
      const querySnapshot = await getDocs(q);
      
      const sessionData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
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

  useEffect(() => {
    if (user) {
      fetchSessions(user.uid);
      loadGithubConfig(user.uid); // Load GitHub config when user changes
    }
  }, [user]);

  // Effect to fetch commits when username or repo changes
  useEffect(() => {
    const getGithubCommits = async () => {
      if (githubUsername && githubRepo) {
        setCommitsLoading(true);
        const fetchedCommits = await fetchCommits(githubUsername, githubRepo);
        setCommits(fetchedCommits);
        setCommitsLoading(false);
      } else {
        setCommits([]);
      }
    };
    getGithubCommits();
  }, [githubUsername, githubRepo]);

  const dailyMetrics = calculateDailyMetrics(sessions);
  const { currentStreak, longestStreak } = calculateStreaks(dailyMetrics);
  
  // Recalculate today's score with actual current streak
  const todayKey = new Date().toISOString().split('T')[0];
  let todaysScore = dailyMetrics[todayKey] ? dailyMetrics[todayKey].dailyScore : 'N/A';
  if (dailyMetrics[todayKey]) {
    const codingMinutes = dailyMetrics[todayKey].coding || 0;
    const breakCount = dailyMetrics[todayKey].breakCount || 0;
    todaysScore = (codingMinutes * 0.7) + (currentStreak * 5) - (breakCount * 2);
  }

  const chartLabels = Object.keys(dailyMetrics).sort();
  const codingData = chartLabels.map(date => dailyMetrics[date].coding);
  const breakData = chartLabels.map(date => dailyMetrics[date].break);
  const sessionCountData = chartLabels.map(date => dailyMetrics[date].sessionCount);
  const averageSessionLengthData = chartLabels.map(date => dailyMetrics[date].averageSessionLength);

  // Prepare commit data for charting
  const commitDates = commits.map(commit => commit.date.toISOString().split('T')[0]);
  const commitChartData = chartLabels.map(date => commitDates.includes(date) ? ChartJS.registry.getScale('y').max * 0.9 : null); // Position at 90% of max Y-axis

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Coding Minutes',
        data: codingData,
        backgroundColor: '#2563eb',
      },
      {
        label: 'Break Minutes',
        data: breakData,
        backgroundColor: '#ef4444',
      },
      {
        type: 'scatter', // Use scatter for commit pulses
        label: 'Commits',
        data: commitChartData,
        backgroundColor: '#84cc16', // Green for commits
        pointRadius: 5,
        pointHoverRadius: 7,
        tooltipEnabled: true, // Enable tooltip for commits
      },
    ],
  };
  
  const sessionCountChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Number of Sessions',
        data: sessionCountData,
        backgroundColor: '#10b981', // Green
      },
    ],
  };

  const averageSessionLengthChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Average Session Length (minutes)',
        data: averageSessionLengthData,
        backgroundColor: '#f59e0b', // Amber
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

  const singleBarChartOptions = {
    responsive: true,
    scales: {
        y: { beginAtZero: true }
    },
    plugins: {
        legend: {
            position: 'top',
        }
    }
  };

  const containerStyle = { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'Arial', color: '#333' };
  const cardStyle = { padding: '15px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9' };
  const filterButtonStyle = (active) => ({ 
    backgroundColor: active ? '#2563eb' : '#e5e7eb', 
    color: active ? 'white' : '#374151', 
    padding: '8px 12px', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    border: 'none', 
    margin: '0 5px', 
    fontSize: '14px' 
  });

  const filteredSessions = sessions.filter(session => {
    if (sessionFilter === 'today') {
      return isToday(session.startTime);
    } else if (sessionFilter === 'thisWeek') {
      return isThisWeek(session.startTime);
    }
    return true; // 'all' filter
  });
   
  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#2563eb', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>DevPulse Dashboard</h1>
      
      <h2 style={{ color: '#2563eb' }}>Today's Productivity Score: {typeof todaysScore === 'number' ? todaysScore.toFixed(1) : todaysScore}</h2>
      <p>Current Streak: {currentStreak} days | Longest Streak: {longestStreak} days</p>

      <h2>GitHub Repository Configuration</h2>
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
        <p>Enter your GitHub username and the repository you want to track commits for.</p>
        <input
          type="text"
          placeholder="GitHub Username"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="text"
          placeholder="GitHub Repository Name"
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button 
          onClick={saveGithubConfig}
          style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontSize: '16px' }}
        >
          Save GitHub Config
        </button>
      </div>

      <h2>Recent GitHub Commits</h2>
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
        {commitsLoading ? (
          <p>Loading commits...</p>
        ) : commits.length > 0 ? (
          <ul>
            {commits.map(commit => (
              <li key={commit.sha} style={{ marginBottom: '10px', borderBottom: '1px dotted #eee', paddingBottom: '5px' }}>
                <strong>{commit.message}</strong><br/>
                <span style={{ fontSize: '0.8em', color: '#555' }}>
                  {commit.author} on {commit.date.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No commits found for the configured repository or repository not configured.</p>
        )}
      </div>

      <h2>Daily Activity Chart</h2>
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          {sessions.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
          ) : (
              <p>Click "Add Random Test Session" to generate data and see the chart!</p>
          )}
      </div>
      
      <h2>Sessions Per Day</h2>
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          {sessions.length > 0 ? (
              <Bar data={sessionCountChartData} options={singleBarChartOptions} />
          ) : (
              <p>Click "Add Random Test Session" to generate data and see the chart!</p>
          )}
      </div>

      <h2>Average Session Length Per Day</h2>
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          {sessions.length > 0 ? (
              <Bar data={averageSessionLengthChartData} options={singleBarChartOptions} />
          ) : (
              <p>Click "Add Random Test Session" to generate data and see the chart!</p>
          )}
      </div>

      <h2>Recent Sessions</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setSessionFilter('today')} style={filterButtonStyle(sessionFilter === 'today')}>Today</button>
        <button onClick={() => setSessionFilter('thisWeek')} style={filterButtonStyle(sessionFilter === 'thisWeek')}>This Week</button>
        <button onClick={() => setSessionFilter('all')} style={filterButtonStyle(sessionFilter === 'all')}>All</button>
      </div>
      
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div>
          {filteredSessions.length === 0 ? (
            <p style={{ color: '#777' }}>No sessions logged for this period.</p>
          ) : (
            <div>
              {filteredSessions.map((session) => (
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
};

export default Dashboard;
