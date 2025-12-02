// src/utils/dataProcessor.js

/**
 * Transforms a list of session objects into a structured object of daily totals.
 * { "YYYY-MM-DD": { coding: X, break: Y, total: Z } }
 */
export const calculateDailyMetrics = (sessions) => {
  const dailyData = {};

sessions.forEach(session => {
    // 1. Normalize the date to YYYY-MM-DD format
    // Ensure session.startTime is a JavaScript Date object (handled in App.js)
    const dateKey = session.startTime.toISOString().split('T')[0];
    const duration = session.durationMinutes || 0;
    const type = session.type || 'coding'; // Default to coding if type is missing

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { coding: 0, break: 0, total: 0 };
    }

    // 2. Aggregate the minutes
    dailyData[dateKey][type] += duration;
    dailyData[dateKey].total += duration;
  });

  return dailyData;
};