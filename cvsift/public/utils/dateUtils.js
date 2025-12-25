/**
 * Utility functions for handling dates in CVSift
 * Handles both Firestore Timestamps and ISO date strings
 */

/**
 * Converts various date formats to a JavaScript Date object
 * @param {*} dateValue - Can be a Firestore Timestamp, ISO string, Date object, or timestamp in seconds
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export function toDate(dateValue) {
  if (!dateValue) return null;

  // Handle Firestore Timestamp objects
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Handle ISO strings or Date objects
  if (typeof dateValue === 'string' || dateValue instanceof Date) {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle timestamp in seconds (Firestore server timestamp format)
  if (dateValue?.seconds) {
    return new Date(dateValue.seconds * 1000);
  }

  return null;
}

/**
 * Formats a date value to a localized date string
 * @param {*} dateValue - Any date format supported by toDate()
 * @param {string} locale - Locale string (default: 'en-GB')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or 'Unknown'
 */
export function formatDate(dateValue, locale = 'en-GB', options = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}) {
  const date = toDate(dateValue);
  if (!date) return 'Unknown';

  return date.toLocaleDateString(locale, options);
}

/**
 * Formats a date value to a localized date and time string
 * @param {*} dateValue - Any date format supported by toDate()
 * @param {string} locale - Locale string (default: 'en-GB')
 * @returns {string} Formatted date and time string or 'Unknown'
 */
export function formatDateTime(dateValue, locale = 'en-GB') {
  const date = toDate(dateValue);
  if (!date) return 'Unknown';

  return date.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gets a relative time string (e.g., "2 hours ago")
 * @param {*} dateValue - Any date format supported by toDate()
 * @returns {string} Relative time string or 'Unknown'
 */
export function formatRelativeTime(dateValue) {
  const date = toDate(dateValue);
  if (!date) return 'Unknown';

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}
