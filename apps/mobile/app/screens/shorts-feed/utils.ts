/**
 * Utility functions for shorts feed
 */

/**
 * Format large numbers into K/M notation
 * 1234 -> "1.2K"
 * 1234567 -> "1.2M"
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
