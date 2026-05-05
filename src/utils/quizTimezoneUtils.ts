/**
 * Quiz-specific timezone utilities for handling quiz creation and expiration
 */

import { convertToUTC, formatUTCLocal, getUserTimezone, getUserTimezoneOffset } from './timezoneUtils';

/**
 * Convert local date/time input to UTC for quiz expiration storage
 * @param localDateTime - Date string or Date object from user's local input
 * @returns UTC ISO string for database storage
 */
export function convertQuizExpirationToUTC(localDateTime: string | Date): string {
  const date = typeof localDateTime === 'string' ? new Date(localDateTime) : localDateTime;
  return convertToUTC(date);
}

/**
 * Get user-friendly expiration display with timezone info
 * @param expirationUTC - UTC expiration time from database
 * @returns Formatted string with timezone info
 */
export function formatExpirationForDisplay(expirationUTC: string): string {
  const localTime = formatUTCLocal(expirationUTC, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  const timezone = getUserTimezone();
  const offset = getUserTimezoneOffset();
  
  return `${localTime} (${timezone}, UTC${offset >= 0 ? '+' : ''}${offset})`;
}

/**
 * Validate quiz expiration time is in the future
 * @param expirationUTC - UTC expiration time to validate
 * @returns Boolean indicating if expiration is valid
 */
export function isValidQuizExpiration(expirationUTC: string): boolean {
  if (!expirationUTC) return false;
  
  const expirationTime = new Date(expirationUTC);
  const now = new Date();
  
  // Must be at least 1 hour in the future
  const minFutureTime = now.getTime() + (60 * 60 * 1000);
  
  return expirationTime.getTime() > minFutureTime;
}

/**
 * Get default quiz expiration options for UI
 * @returns Array of preset expiration options
 */
export function getDefaultExpirationOptions(): Array<{ label: string; value: string; hours: number }> {
  const now = new Date();
  
  return [
    {
      label: '1 hour',
      value: convertQuizExpirationToUTC(new Date(now.getTime() + 60 * 60 * 1000)),
      hours: 1
    },
    {
      label: '6 hours',
      value: convertQuizExpirationToUTC(new Date(now.getTime() + 6 * 60 * 60 * 1000)),
      hours: 6
    },
    {
      label: '24 hours (1 day)',
      value: convertQuizExpirationToUTC(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
      hours: 24
    },
    {
      label: '3 days',
      value: convertQuizExpirationToUTC(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)),
      hours: 72
    },
    {
      label: '7 days (1 week)',
      value: convertQuizExpirationToUTC(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
      hours: 168
    },
    {
      label: '30 days (1 month)',
      value: convertQuizExpirationToUTC(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
      hours: 720
    }
  ];
}

/**
 * Create quiz expiration from custom date/time input
 * @param date - Date part of expiration
 * @param time - Time part of expiration
 * @returns UTC ISO string for storage
 */
export function createCustomExpiration(date: string, time: string): string {
  const dateTimeString = `${date}T${time}`;
  const localDate = new Date(dateTimeString);
  
  if (isNaN(localDate.getTime())) {
    throw new Error('Invalid date/time combination');
  }
  
  return convertQuizExpirationToUTC(localDate);
}

/**
 * Get time remaining until quiz expiration
 * @param expirationUTC - UTC expiration time
 * @returns Object with time remaining details
 */
export function getTimeRemaining(expirationUTC: string): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
} {
  const now = new Date();
  const expirationTime = new Date(expirationUTC);
  const diff = expirationTime.getTime() - now.getTime();
  
  if (diff <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
      formatted: 'Expired'
    };
  }
  
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  
  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m`;
  
  return {
    expired: false,
    days,
    hours,
    minutes,
    totalMinutes,
    formatted: formatted.trim() || 'Less than 1m'
  };
}
