/**
 * KidsMap Mobile - Timing Constants
 *
 * Centralized timing values for animations, caching, and debouncing
 */

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE = {
  SEARCH: 300,
  INPUT: 150,
  SCROLL: 100,
  MAP_MOVE: 250,
} as const;

/**
 * Cache TTL (Time To Live) values (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 10, // 10 minutes
  LONG: 1000 * 60 * 30, // 30 minutes
  HOUR: 1000 * 60 * 60, // 1 hour
  DAY: 1000 * 60 * 60 * 24, // 24 hours
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
  SHEET_OPEN: 300,
  SHEET_CLOSE: 200,
  FADE_IN: 200,
  FADE_OUT: 150,
  SCALE: 200,
} as const;

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUT = {
  REFRESH: 1000,
  API_REQUEST: 10000,
  LOCATION: 15000,
  TOAST: 3000,
  SPLASH_SCREEN: 2000,
} as const;

/**
 * Interval values (in milliseconds)
 */
export const INTERVAL = {
  LOCATION_UPDATE: 1000 * 60, // 1 minute
  AUTO_SAVE: 1000 * 30, // 30 seconds
  HEARTBEAT: 1000 * 60 * 5, // 5 minutes
} as const;
