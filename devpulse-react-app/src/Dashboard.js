import React, { useState, useEffect, useCallback } from "react";
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

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

const Dashboard = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState('all'); // 'all', 'today', 'thisWeek'
  const [githubUsername, setGithubUsername] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState(''); // New state for GitHub Token
  const [configuredGithubUsername, setConfiguredGithubUsername] = useState('');
  const [configuredGithubRepo, setConfiguredGithubRepo] = useState('');
  const [configuredGithubToken, setConfiguredGithubToken] = useState('');
  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  // Debounced setters
  // const debouncedSetGithubUsername = useCallback(debounce((value) => setGithubUsername(value), 500), []);
  // const debouncedSetGithubRepo = useCallback(debounce((value) => setGithubRepo(value), 500), []);
  // const debouncedSetGithubToken = useCallback(debounce((value) => setGithubToken(value), 500), []);

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
        setGithubToken(data.githubToken || '');
        setConfiguredGithubUsername(data.githubUsername || '');
        setConfiguredGithubRepo(data.githubRepo || '');
        setConfiguredGithubToken(data.githubToken || '');
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
        githubToken: githubToken, // Save GitHub Token
      }, { merge: true }); // Use merge: true to avoid overwriting other fields
      setConfiguredGithubUsername(githubUsername);
      setConfiguredGithubRepo(githubRepo);
      setConfiguredGithubToken(githubToken);
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

  // Effect to fetch commits when username, repo, or token changes
  useEffect(() => {
    const getGithubCommits = async () => {
      if (configuredGithubUsername && configuredGithubRepo) {
        setCommitsLoading(true);
        const fetchedCommits = await fetchCommits(configuredGithubUsername, configuredGithubRepo, configuredGithubToken);
        setCommits(fetchedCommits);
        setCommitsLoading(false);
      } else {
        setCommits([]);
      }
    };
    // Only fetch commits if configuredGithubUsername and configuredGithubRepo are available.
    // API calls are now triggered only when the configuration is explicitly saved.
    if (configuredGithubUsername && configuredGithubRepo) {
      getGithubCommits();
    }
  }, [configuredGithubUsername, configuredGithubRepo, configuredGithubToken]);

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

  // Calculate max Y value for positioning commit pulses
  const allChartDataValues = [...codingData, ...breakData].filter(value => value != null);
  const maxYValue = allChartDataValues.length > 0 ? Math.max(...allChartDataValues) : 10; // Default to 10 if no data

  // Prepare commit data for charting
  const commitDates = commits.map(commit => commit.date.toISOString().split('T')[0]);
  const commitChartData = chartLabels.map(date => commitDates.includes(date) ? maxYValue * 0.9 : null); // Position at 90% of max Y-axis

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

  const containerStyle = { 
    maxWidth: '900px', 
    margin: '40px auto', 
    padding: '30px', 
    fontFamily: "'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif", 
    color: '#333', 
    backgroundColor: '#f9fafb', 
    borderRadius: '12px', 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  };
  const headerStyle = { 
    color: '#1d4ed8', 
    borderBottom: '2px solid #e5e7eb', 
    paddingBottom: '15px', 
    marginBottom: '30px', 
    fontSize: '2.2em', 
    fontWeight: '700' 
  };
  const sectionTitleStyle = { 
    color: '#1f2937', 
    borderBottom: '1px solid #e5e7eb', 
    paddingBottom: '10px', 
    marginBottom: '20px', 
    fontSize: '1.6em', 
    fontWeight: '600' 
  };
  const buttonBaseStyle = { 
    padding: '10px 20px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    border: 'none', 
    fontSize: '1em', 
    fontWeight: '600', 
    transition: 'all 0.2s ease-in-out' 
  };
  const primaryButtonStyle = { 
    ...buttonBaseStyle, 
    backgroundColor: '#2563eb', 
    color: 'white', 
    '&:hover': { backgroundColor: '#1e40af' } 
  };
  const secondaryButtonStyle = { 
    ...buttonBaseStyle, 
    backgroundColor: '#e5e7eb', 
    color: '#374151', 
    '&:hover': { backgroundColor: '#d1d5db' } 
  };
  const cardStyle = { 
    padding: '15px', 
    margin: '10px 0', 
    border: '1px solid #e5e7eb', 
    borderRadius: '8px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    background: '#ffffff', 
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' 
  };
  const inputStyle = { 
    width: '100%', 
    padding: '10px', 
    margin: '8px 0', 
    borderRadius: '6px', 
    border: '1px solid #d1d5db', 
    fontSize: '1em', 
    boxSizing: 'border-box' 
  };

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
      <h1 style={headerStyle}>DevPulse Dashboard</h1>
      
      {/* Removed Add Random Test Session button */}

      <h2 style={sectionTitleStyle}>Today's Productivity Score: {typeof todaysScore === 'number' ? todaysScore.toFixed(1) : todaysScore}</h2>
      <p style={{ fontSize: '1.1em', color: '#4b5563', marginBottom: '30px' }}>
        Current Streak: <strong style={{ color: '#16a34a' }}>{currentStreak} days</strong> | 
        Longest Streak: <strong style={{ color: '#059669' }}>{longestStreak} days</strong>
      </p>

      <h2 style={sectionTitleStyle}>GitHub Repository Configuration</h2>
      <div style={{ marginBottom: '40px', padding: '25px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.06)' }}>
        <p style={{ marginBottom: '15px', color: '#4b5563' }}>Enter your GitHub username and the repository you want to track commits for.</p>
        <input
          type="text"
          placeholder="GitHub Username"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="GitHub Repository Name"
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="GitHub Personal Access Token (Optional)"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          style={inputStyle}
        />
        <button 
          onClick={saveGithubConfig}
          style={{ ...primaryButtonStyle, marginTop: '15px' }}
        >
          Save GitHub Config
        </button>
      </div>

      <h2 style={sectionTitleStyle}>Recent GitHub Commits</h2>
      <div style={{ marginBottom: '40px', padding: '25px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.06)' }}>
        {commitsLoading ? (
          <p>Loading commits...</p>
        ) : commits.length > 0 ? (
          <ul>
            {commits.map(commit => (
              <li key={commit.sha} style={{ marginBottom: '10px', borderBottom: '1px dotted #e5e7eb', paddingBottom: '5px', color: '#374151' }}>
                <strong style={{ color: '#1f2937' }}>{commit.message}</strong><br/>
                <span style={{ fontSize: '0.9em', color: '#6b7280' }}>
                  {commit.author} on {commit.date.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#6b7280' }}>No commits found for the configured repository or repository not configured.</p>
        )}
      </div>

      <h2 style={sectionTitleStyle}>Daily Activity Chart</h2>
      <div style={{ marginBottom: '40px', padding: '25px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.06)' }}>
          {sessions.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
          ) : (
              <p style={{ color: '#6b7280' }}>Log sessions via the VS Code extension to see your daily activity!</p>
          )}
      </div>
      
      <h2 style={sectionTitleStyle}>Sessions Per Day</h2>
      <div style={{ marginBottom: '40px', padding: '25px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.06)' }}>
          {sessions.length > 0 ? (
              <Bar data={sessionCountChartData} options={singleBarChartOptions} />
          ) : (
              <p style={{ color: '#6b7280' }}>Log sessions via the VS Code extension to see your sessions per day!</p>
          )}
      </div>

      <h2 style={sectionTitleStyle}>Average Session Length Per Day</h2>
      <div style={{ marginBottom: '40px', padding: '25px', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.06)' }}>
          {sessions.length > 0 ? (
              <Bar data={averageSessionLengthChartData} options={singleBarChartOptions} />
          ) : (
              <p style={{ color: '#6b7280' }}>Log sessions via the VS Code extension to see your average session length!</p>
          )}
      </div>

      <h2 style={sectionTitleStyle}>Recent Sessions</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setSessionFilter('today')} style={sessionFilter === 'today' ? primaryButtonStyle : secondaryButtonStyle}>Today</button>
        <button onClick={() => setSessionFilter('thisWeek')} style={sessionFilter === 'thisWeek' ? primaryButtonStyle : secondaryButtonStyle}>This Week</button>
        <button onClick={() => setSessionFilter('all')} style={sessionFilter === 'all' ? primaryButtonStyle : secondaryButtonStyle}>All</button>
      </div>
      
      {loading ? (
        <p style={{ color: '#4b5563' }}>Loading data...</p>
      ) : (
        <div>
          {filteredSessions.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No sessions logged for this period.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {filteredSessions.map((session) => (
                <div key={session.id} style={cardStyle}>
                  <div>
                    <strong style={{ textTransform: 'capitalize', color: '#1f2937' }}>{session.type} Session</strong>
                    <p style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '5px' }}>
                       {session.startTime ? session.startTime.toLocaleString() : 'Time not recorded'}
                    </p>
                  </div>
                  <span style={{ backgroundColor: session.type === 'coding' ? '#d1fae5' : '#fee2e2', color: session.type === 'coding' ? '#065f46' : '#991b1b', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9em' }}>
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
