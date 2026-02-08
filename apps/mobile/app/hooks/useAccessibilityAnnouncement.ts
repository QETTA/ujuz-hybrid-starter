/**
 * KidsMap Mobile - Accessibility Announcement Hook
 *
 * Provides a hook for announcing dynamic content changes to screen readers
 * Uses AccessibilityInfo.announceForAccessibility() for both iOS and Android
 */

import { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { formatAnnouncement } from '@/app/utils/accessibility';

/**
 * Hook for making accessibility announcements to screen readers
 *
 * @example
 * const { announce } = useAccessibilityAnnouncement();
 *
 * // Announce loading state
 * announce('loading', 'Loading places near you');
 *
 * // Announce error
 * announce('error', 'Failed to load places');
 *
 * // Announce success
 * announce('success', 'Place saved to favorites');
 */
export function useAccessibilityAnnouncement() {
  /**
   * Announce a message to the screen reader
   *
   * @param type - Type of announcement (loading, error, success, info)
   * @param message - The message to announce
   */
  const announce = useCallback(
    (type: 'loading' | 'error' | 'success' | 'info', message: string) => {
      const formattedMessage = formatAnnouncement(type, message);

      // announceForAccessibility is supported on both iOS and Android
      AccessibilityInfo.announceForAccessibility(formattedMessage);
    },
    []
  );

  /**
   * Announce a raw message without formatting
   *
   * @param message - The raw message to announce
   */
  const announceRaw = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  return {
    announce,
    announceRaw,
  };
}
