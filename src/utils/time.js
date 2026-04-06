/**
 * Time utilities for EPG timestamp handling
 * @module utils/time
 */

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_2_HOURS = 7200;

/**
 * Round a Unix timestamp down to the nearest hour
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {number} Rounded timestamp
 */
export const roundToHour = (timestamp) =>
  Math.floor(timestamp / SECONDS_PER_HOUR) * SECONDS_PER_HOUR;

/**
 * Round a Unix timestamp down to the nearest 2-hour boundary
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {number} Rounded timestamp
 */
export const roundTo2Hours = (timestamp) =>
  Math.floor(timestamp / SECONDS_PER_2_HOURS) * SECONDS_PER_2_HOURS;

/**
 * Format a Unix timestamp as HH:MM
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a Unix timestamp as a date string (e.g., "Lundi 5 avril")
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

/**
 * Format a duration in seconds as a human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h30", "45min")
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / 60);

  if (hours === 0) {
    return `${minutes}min`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${String(minutes).padStart(2, '0')}`;
};

/**
 * Generate an array of hourly bucket timestamps covering a time range
 * @param {number} startTs - Start Unix timestamp in seconds
 * @param {number} endTs - End Unix timestamp in seconds
 * @returns {Array<number>} Array of rounded hourly timestamps
 */
export const getHourBuckets = (startTs, endTs) => {
  const start = roundToHour(startTs);
  const end = roundToHour(endTs);
  const buckets = [];

  for (let ts = start; ts <= end; ts += SECONDS_PER_HOUR) {
    buckets.push(ts);
  }

  return buckets;
};

/**
 * Get current Unix timestamp in seconds
 * @returns {number} Current timestamp
 */
export const nowTimestamp = () => Math.floor(Date.now() / 1000);

/**
 * Build a Unix timestamp for today at a given hour and minute
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {number} Unix timestamp in seconds
 */
export const todayAt = (hour, minute) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return Math.floor(date.getTime() / 1000);
};
