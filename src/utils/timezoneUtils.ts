/**
 * Timezone Utilities for Halifax (America/Halifax)
 * Automatically handles ADT (UTC-3) and AST (UTC-4) based on daylight saving rules
 */

const HALIFAX_TIMEZONE = 'America/Halifax';

/**
 * Convert UTC time string to Halifax time
 * Automatically handles daylight saving time
 */
export const convertUTCToHalifax = (utcTimeString: string): string => {
  const utcDate = new Date(utcTimeString);
  const halifaxDate = new Date(utcDate.toLocaleString('en-US', { timeZone: HALIFAX_TIMEZONE }));
  return halifaxDate.toISOString().slice(0, 16);
};

/**
 * Convert UTC time string to Halifax time (HH:MM format)
 * Automatically handles daylight saving time
 */
export const convertUTCTimeToHalifaxTime = (utcTimeString: string): string => {
  try {
    const utcDate = new Date(utcTimeString);
    
    const halifaxTimeString = utcDate.toLocaleString('en-US', {
      timeZone: HALIFAX_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return halifaxTimeString;
  } catch (error) {
    console.error('Error converting UTC time to Halifax time:', error);
    return utcTimeString.slice(11, 16);
  }
};

/**
 * Convert Halifax time to UTC
 * Automatically handles daylight saving time
 */
export const convertHalifaxToUTC = (halifaxTimeString: string): string => {
  try {
    if (halifaxTimeString.includes('T') && halifaxTimeString.includes('-')) {
      return new Date(halifaxTimeString).toISOString();
    }
    
    const [hours, minutes] = halifaxTimeString.split(':');
    const halifaxDate = new Date();
    halifaxDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const utcDate = new Date(halifaxDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting Halifax time to UTC:', error);
    return halifaxTimeString;
  }
};

/**
 * Get the current offset between Halifax timezone and UTC in milliseconds
 * Automatically handles daylight saving time
 */
export const getHalifaxUTCOffsetMs = (): number => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const halifaxDate = new Date(now.toLocaleString('en-US', { timeZone: HALIFAX_TIMEZONE }));
  return halifaxDate.getTime() - utcDate.getTime();
};

/**
 * Create a date string with Halifax timezone offset
 * Format: YYYY-MM-DDTHH:MM:SS±HH:MM
 * Automatically handles daylight saving time
 */
export const createDateStringWithHalifaxOffset = (dateString: string, timeString: string): string => {
  const offsetMs = getHalifaxUTCOffsetMs();
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor((Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000));
  const sign = offsetMs >= 0 ? '+' : '-';
  const offsetString = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  
  return `${dateString}T${timeString}${offsetString}`;
};

/**
 * Get Halifax date string (YYYY-MM-DD)
 * Automatically handles daylight saving time
 */
export const getHalifaxDateString = (date: Date): string => {
  return date.toLocaleDateString('en-CA', { timeZone: HALIFAX_TIMEZONE }).split('/').reverse().join('-');
};
