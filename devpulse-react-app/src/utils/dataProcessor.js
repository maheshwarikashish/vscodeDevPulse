/**
 * Transforms a list of session objects into a structured object of daily totals.
 * * @param {Array<Object>} sessions - List of session objects from Firestore.
 * @returns {Object} - Format: { "YYYY-MM-DD": { coding: X, break: Y, total: Z, sessionCount: N, averageSessionLength: A } }
 */
export const calculateDailyMetrics = (sessions) => {
  const dailyData = {};

  sessions.forEach(session => {
    // 1. Normalize the date key (YYYY-MM-DD)
    // session.startTime must be a JavaScript Date object (handled in App.js)
    const dateKey = session.startTime.toISOString().split('T')[0];
    const duration = session.durationMinutes || 0;
    const type = session.type || 'coding'; // Default to coding if type is missing

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { coding: 0, break: 0, total: 0, sessionCount: 0, totalCodingDuration: 0, breakCount: 0 };
    }

    // 2. Aggregate the minutes for the specific type
    dailyData[dateKey][type] += duration;
    dailyData[dateKey].total += duration;

    if (type === 'coding') {
      dailyData[dateKey].sessionCount += 1;
      dailyData[dateKey].totalCodingDuration += duration;
    } else if (type === 'break') {
      dailyData[dateKey].breakCount += 1;
    }
  });

  // Calculate average session length and daily score after all sessions are processed
  Object.keys(dailyData).forEach(dateKey => {
    const day = dailyData[dateKey];
    day.averageSessionLength = day.sessionCount > 0 ? day.totalCodingDuration / day.sessionCount : 0;
    delete day.totalCodingDuration; // Clean up temporary field

    // Calculate Daily Productivity Score
    const codingMinutes = day.coding || 0;
    const streakDays = 0; // Placeholder for now, will be implemented later
    const breakCount = day.breakCount || 0;
    day.dailyScore = (codingMinutes * 0.7) + (streakDays * 5) - (breakCount * 2);
  });

  return dailyData;
};

/**
 * Calculates the current and longest coding streaks.
 * @param {Object} dailyMetrics - The object containing daily metrics calculated by calculateDailyMetrics.
 * @returns {Object} - An object with currentStreak and longestStreak.
 */
export const calculateStreaks = (dailyMetrics) => {
  const sortedDates = Object.keys(dailyMetrics).sort();
  let currentStreak = 0;
  let longestStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const dayMetrics = dailyMetrics[date];

    // Check if there was any coding activity on this day
    if (dayMetrics.coding > 0) {
      currentStreak++;
    } else {
      // If there's a gap, reset the current streak
      currentStreak = 0;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  // To calculate the actual current streak for today, we need to consider if today has coding data.
  // If the last day in sortedDates is today and it has coding activity, then currentStreak is correct.
  // If the last day is not today, or today has no coding activity, then currentStreak should be 0.
  const today = new Date().toISOString().split('T')[0];
  if (!dailyMetrics[today] || dailyMetrics[today].coding === 0) {
      currentStreak = 0;
  }

  return { currentStreak, longestStreak };
};

/**
 * Checks if a given date is today.
 * @param {Date} date - The date to check.
 * @returns {boolean}
 */
export const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

/**
 * Checks if a given date is within the current week (Sunday to Saturday).
 * @param {Date} date - The date to check.
 * @returns {boolean}
 */
export const isThisWeek = (date) => {
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Saturday
  
  return date >= firstDayOfWeek && date <= lastDayOfWeek;
};