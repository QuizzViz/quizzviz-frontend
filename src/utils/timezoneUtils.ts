/**
 * Timezone utilities for handling quiz expiration times across different timezones
 */

/**
 * Convert local date/time to UTC ISO string for database storage
 * @param localDate - Date in user's local timezone
 * @returns UTC ISO string for storage
 */
export function convertToUTC(localDate: Date): string {
  return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
}

/**
 * Convert UTC date from database to user's local timezone
 * @param utcString - UTC ISO string from database
 * @returns Date in user's local timezone
 */
export function convertFromUTC(utcString: string): Date {
  const date = new Date(utcString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

/**
 * Get user's current timezone offset in hours
 * @returns Timezone offset (e.g., -5 for EST, +5 for PKT)
 */
export function getUserTimezoneOffset(): number {
  return -(new Date().getTimezoneOffset() / 60);
}

/**
 * Get user's timezone string (e.g., "America/New_York", "Asia/Karachi")
 * @returns Timezone string or fallback
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/**
 * Format UTC time for display in user's local timezone
 * @param utcString - UTC ISO string from database
 * @param formatOptions - Date formatting options
 * @returns Formatted local time string
 */
export function formatUTCLocal(utcString: string, formatOptions?: Intl.DateTimeFormatOptions): string {
  const date = new Date(utcString);
  return date.toLocaleString(undefined, {
    timeZone: getUserTimezone(),
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...formatOptions
  });
}

/**
 * Check if quiz has expired considering timezone
 * @param expirationUTC - Expiration time in UTC from database
 * @returns Boolean indicating if quiz is expired
 */
export function isQuizExpired(expirationUTC: string): boolean {
  if (!expirationUTC) return false;
  
  const now = new Date();
  const expirationTime = new Date(expirationUTC);
  
  return now > expirationTime;
}

/**
 * Create a default expiration time (7 days from now) in UTC
 * @returns UTC ISO string for 7 days from now
 */
export function createDefaultExpiration(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Get timezone info for display to user
 * @returns Object with timezone information
 */
export function getTimezoneInfo() {
  const timezone = getUserTimezone();
  const offset = getUserTimezoneOffset();
  const offsetString = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
  
  return {
    timezone,
    offset,
    offsetString,
    currentTime: new Date().toLocaleString(undefined, { timeZone: timezone })
  };
}
