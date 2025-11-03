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
 * Automatically handles daylight saving time (ADT/AST transitions)
 * Properly handles DST changes using Halifax timezone
 * 
 * For recurring shifts (time-of-day), uses a FIXED reference date
 * to ensure consistent UTC storage regardless of when created.
 * This ensures 9:00 AM always displays as 9:00 AM.
 * 
 * @param halifaxTimeString - Time string (HH:MM) or full datetime
 * @param useFixedReference - If true, use fixed date (2000-01-15) for consistent storage
 */
export const convertHalifaxToUTC = (halifaxTimeString: string, useFixedReference: boolean = true): string => {
  try {
    // If already a full ISO datetime string, parse it directly
    if (halifaxTimeString.includes('T') && halifaxTimeString.includes('-')) {
      // Check if it has timezone offset (e.g., -03:00 or -04:00)
      if (halifaxTimeString.match(/[+-]\d{2}:\d{2}$/)) {
        // Has timezone offset, parse directly - this is correct
        return new Date(halifaxTimeString).toISOString();
      } else {
        // No timezone specified - treat as UTC
        return new Date(halifaxTimeString).toISOString();
      }
    }
    
    // Handle time-only format (HH:MM or HH:MM:SS)
    // Parse the time components
    const timeParts = halifaxTimeString.split(':').map(s => s.trim());
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1] || '0');
    const seconds = parseInt(timeParts[2] || '0');
    
    // Determine reference date based on useFixedReference flag
    let referenceDateStr: string;
    if (useFixedReference) {
      // For recurring shifts: Use fixed date to ensure consistent UTC storage
      // This ensures 9:00 AM always stores as same UTC value regardless of DST period
      referenceDateStr = '2000-01-15'; // Fixed date always in AST
    } else {
      // For one-time shifts: Use the date from the input string
      // Check if input has date component (YYYY-MM-DD format)
      if (halifaxTimeString.includes('T') && halifaxTimeString.includes('-')) {
        // Extract date part from datetime string (e.g., "2025-11-10T09:00")
        const datePart = halifaxTimeString.split('T')[0];
        referenceDateStr = datePart;
      } else {
        // If no date in input, use today (fallback - shouldn't happen for one-time shifts)
        const now = new Date();
        referenceDateStr = now.toLocaleDateString('en-CA', { timeZone: HALIFAX_TIMEZONE });
      }
    }
    
    const [refYear, refMonth, refDay] = referenceDateStr.split('-').map(Number);
    
    // CORRECT METHOD: Use a date string with Halifax timezone offset
    // We need to dynamically calculate the offset for this specific date
    // to handle DST correctly
    
    // Step 1: Create a test UTC date at noon on the reference date
    const testUTCDate = new Date(Date.UTC(refYear, refMonth - 1, refDay, 12, 0, 0));
    
    // Step 2: Get what time it is in Halifax for this UTC noon
    const halifaxNoonTime = testUTCDate.toLocaleString('en-US', {
      timeZone: HALIFAX_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Step 3: Calculate the offset in hours
    // If UTC 12:00 = Halifax X:00, then Halifax is (12 - X) hours BEHIND UTC
    // So to convert Halifax → UTC, we ADD the offset (because UTC is ahead)
    const halifaxNoonHour = parseInt(halifaxNoonTime.split(':')[0]);
    const offsetHours = 12 - halifaxNoonHour; // This is how many hours Halifax is behind UTC
    
    // Step 4: Apply the offset to convert Halifax time to UTC
    // Halifax is behind UTC, so we ADD the offset: UTC = Halifax + offset
    let utcHour = hours + offsetHours;
    let utcDay = refDay;
    let utcMonth = refMonth;
    let utcYear = refYear;
    
    // Handle day rollover (when UTC hour goes negative or over 24)
    if (utcHour < 0) {
      utcHour += 24;
      utcDay--;
      if (utcDay < 1) {
        utcMonth--;
        if (utcMonth < 1) {
          utcMonth = 12;
          utcYear--;
        }
        utcDay = new Date(utcYear, utcMonth, 0).getDate();
      }
    } else if (utcHour >= 24) {
      utcHour -= 24;
      utcDay++;
      const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
      if (utcDay > daysInMonth) {
        utcDay = 1;
        utcMonth++;
        if (utcMonth > 12) {
          utcMonth = 1;
          utcYear++;
        }
      }
    }
    
    // Step 5: Create the UTC date
    const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, minutes, seconds));
    
    // Step 6: Verify by converting back to Halifax and checking it matches
    // This ensures correctness
    const verification = utcDate.toLocaleString('en-US', {
      timeZone: HALIFAX_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const expected = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // If verification doesn't match, try the other offset (in case of edge case)
    if (verification !== expected) {
      // Try with the other possible offset
      const altOffset = offsetHours === 3 ? 4 : 3;
      let altUTCHour = hours + altOffset; // FIXED: Add offset, not subtract
      let altUTCDay = utcDay;
      let altUTCMonth = utcMonth;
      let altUTCYear = utcYear;
      
      if (altUTCHour < 0) {
        altUTCHour += 24;
        altUTCDay--;
      } else if (altUTCHour >= 24) {
        altUTCHour -= 24;
        altUTCDay++;
      }
      
      const altUTCDate = new Date(Date.UTC(altUTCYear, altUTCMonth - 1, altUTCDay, altUTCHour, minutes, seconds));
      const altVerification = altUTCDate.toLocaleString('en-US', {
        timeZone: HALIFAX_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      if (altVerification === expected) {
        return altUTCDate.toISOString();
      }
    }
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting Halifax time to UTC:', error, halifaxTimeString);
    throw error;
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
