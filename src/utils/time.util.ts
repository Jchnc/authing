/**
 * Time offset helpers for generating future Date objects based on "now".
 *
 * These utilities are meant to be used when setting expiration timestamps
 * such as OTP codes, sessions, tokens, temporary locks, cooldowns, etc.
 *
 * --------------------------------------------------------------------------
 * EXAMPLES (assuming current time = 2025-01-10T12:00:00.000Z)
 * --------------------------------------------------------------------------
 * inSeconds(30)  -> 2025-01-10T12:00:30.000Z
 * inMinutes(5)   -> 2025-01-10T12:05:00.000Z
 * inHours(1)     -> 2025-01-10T13:00:00.000Z
 * inDays(2)      -> 2025-01-12T12:00:00.000Z
 * inWeeks(1)     -> 2025-01-17T12:00:00.000Z
 *
 * Usage:
 *   expiresAt: inMinutes(5)
 *   lockUntil: inHours(2)
 *   retryAt: inSeconds(30)
 */

/**
 * Returns a Date representing the current moment plus `n` seconds.
 * @param n Number of seconds to add.
 */
export const inSeconds = (n: number): Date => {
  return new Date(Date.now() + n * 1000);
};

/**
 * Returns a Date representing the current moment plus `n` minutes.
 * @param n Number of minutes to add.
 */
export const inMinutes = (n: number): Date => {
  return new Date(Date.now() + n * 60 * 1000);
};

/**
 * Returns a Date representing the current moment plus `n` hours.
 * @param n Number of hours to add.
 */
export const inHours = (n: number): Date => {
  return new Date(Date.now() + n * 60 * 60 * 1000);
};

/**
 * Returns a Date representing the current moment plus `n` days.
 * @param n Number of days to add.
 */
export const inDays = (n: number): Date => {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
};

/**
 * Returns a Date representing the current moment plus `n` weeks.
 * @param n Number of weeks to add.
 */
export const inWeeks = (n: number): Date => {
  return new Date(Date.now() + n * 7 * 24 * 60 * 60 * 1000);
};
