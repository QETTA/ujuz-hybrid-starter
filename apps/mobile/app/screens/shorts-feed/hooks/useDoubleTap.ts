/**
 * useDoubleTap Hook
 *
 * Detects double-tap gestures for liking videos
 * Double tap within 300ms triggers onDoubleTap callback
 */

import { useRef, useCallback } from 'react';

const DOUBLE_TAP_DELAY = 300;
const COOLDOWN_DELAY = 1000; // 1 second cooldown after double tap

export function useDoubleTap(onDoubleTap: () => void) {
  const lastTap = useRef<number>(0);
  const lastDoubleTap = useRef<number>(0);

  const handleTap = useCallback(() => {
    const now = Date.now();

    // Check if we're in cooldown period after a recent double tap
    if (now - lastDoubleTap.current < COOLDOWN_DELAY) {
      return;
    }

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      onDoubleTap();
      lastDoubleTap.current = now;
    }

    lastTap.current = now;
  }, [onDoubleTap]);

  return handleTap;
}
