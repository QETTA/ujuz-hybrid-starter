/**
 * UJUz Mobile - Screen Reader Status Hook
 *
 * Detects whether a screen reader (VoiceOver on iOS, TalkBack on Android) is active
 * Useful for conditional rendering or behavior changes when screen reader is enabled
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook that detects screen reader status
 *
 * @example
 * const isScreenReaderEnabled = useScreenReaderStatus();
 *
 * if (isScreenReaderEnabled) {
 *   // Provide additional accessibility features
 * }
 *
 * @returns boolean indicating if screen reader is currently enabled
 */
export function useScreenReaderStatus(): boolean {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderEnabled(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, []);

  return isScreenReaderEnabled;
}
