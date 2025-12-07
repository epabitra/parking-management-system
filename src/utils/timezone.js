/**
 * Timezone Utilities
 * Handle timezone conversions for dates
 */

/**
 * Convert a date string to UTC
 * @param {string} dateString - Date string in format YYYY-MM-DD
 * @param {string} timezone - Timezone (e.g., 'Asia/Kolkata', 'America/New_York')
 * @param {boolean} isEndOfDay - If true, set to 23:59:59, else 00:00:00
 * @returns {Date} - UTC Date object
 */
export const convertToUTC = (dateString, timezone, isEndOfDay = false) => {
  if (!dateString) return null;
  
  // Parse date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date string with time
  const timeStr = isEndOfDay ? '23:59:59' : '00:00:00';
  const dateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeStr}`;
  
  // Use Intl API to create date in the specified timezone
  // Create a date object representing the local time in the timezone
  const dateInTimezone = new Date(dateTimeStr);
  
  // Get the timezone offset
  // Create a formatter to get the offset
  const utcDate = new Date(dateTimeStr + 'Z');
  const tzDate = new Date(dateTimeStr);
  
  // Calculate offset: difference between UTC and timezone
  // Use Intl.DateTimeFormat to format in the timezone
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });
  
  // Get offset by comparing UTC time with timezone time
  // This is a simplified approach - for production, use date-fns-tz
  const offsetMs = getTimezoneOffsetMs(timezone, dateInTimezone);
  
  // Convert to UTC by subtracting the offset
  return new Date(dateInTimezone.getTime() - offsetMs);
};

/**
 * Get timezone offset in milliseconds
 */
function getTimezoneOffsetMs(timezone, date) {
  // Use Intl.DateTimeFormat to get offset
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  
  return tzDate.getTime() - utcDate.getTime();
}

/**
 * Convert UTC date to user's timezone
 * @param {string|Date} utcDate - UTC date string or Date object
 * @param {string} timezone - Target timezone
 * @returns {Date} - Date in user's timezone (for display purposes)
 */
export const convertFromUTC = (utcDate, timezone) => {
  if (!utcDate) return null;
  
  const date = new Date(utcDate);
  
  // Use Intl.DateTimeFormat to format in the target timezone
  // This returns a formatted string, we'll parse it back to a Date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  return new Date(
    parseInt(parts.find(p => p.type === 'year').value),
    parseInt(parts.find(p => p.type === 'month').value) - 1,
    parseInt(parts.find(p => p.type === 'day').value),
    parseInt(parts.find(p => p.type === 'hour').value),
    parseInt(parts.find(p => p.type === 'minute').value),
    parseInt(parts.find(p => p.type === 'second').value)
  );
};

/**
 * Format date in user's timezone
 * @param {string|Date} utcDate - UTC date string or Date object
 * @param {string} timezone - User's timezone
 * @param {string} format - Format string (default: 'MMM dd, yyyy HH:mm')
 * @returns {string} - Formatted date string
 */
export const formatInTimezone = (utcDate, timezone, format = 'MMM dd, yyyy HH:mm') => {
  if (!utcDate) return 'N/A';
  
  try {
    const date = new Date(utcDate);
    
    // Use Intl.DateTimeFormat to format in the user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    // Get formatted parts
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const monthValue = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    
    // Get numeric month for MM format
    const monthIndex = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getMonth();
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return format
      .replace('yyyy', year)
      .replace('MMM', monthNames[monthIndex] || month)
      .replace('MM', monthNum)
      .replace('dd', day)
      .replace('HH', hour)
      .replace('mm', minute);
  } catch (error) {
    console.error('Timezone formatting error:', error);
    // Fallback to simple formatting
    try {
      const date = new Date(utcDate);
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return new Date(utcDate).toLocaleString();
    }
  }
};

/**
 * Get user's timezone from employee data or default
 * @param {Object} user - User/Employee object
 * @returns {string} - Timezone string
 */
export const getUserTimezone = (user) => {
  return user?.timezone || 'UTC';
};

/**
 * Common timezones list
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - Indian Standard Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
];

/**
 * Get list of common timezone strings
 * @returns {Array<string>} - Array of timezone strings
 */
export const getCommonTimezones = () => {
  return [
    'UTC',
    'Asia/Kolkata',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Africa/Cairo',
    'America/Sao_Paulo',
    'Asia/Dubai',
    'Pacific/Auckland',
    'Asia/Singapore',
  ].sort();
};

