/**
 * Animation Presets - iOS 26 Refined
 *
 * Production-ready animation configurations
 * Optimized for native driver performance
 */

import { Animated, Easing } from 'react-native';
import {
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';

// ============================================
// Spring Presets (Reanimated 2/3)
// ============================================

export const SpringPresets = {
  /** Default iOS spring - snappy with slight bounce */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  /** Gentle spring - slower, smoother */
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1.2,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  /** Bouncy spring - more playful */
  bouncy: {
    damping: 14,
    stiffness: 160,
    mass: 0.9,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  /** Stiff spring - quick, minimal overshoot */
  stiff: {
    damping: 25,
    stiffness: 200,
    mass: 1,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },

  /** Bottom sheet spring - iOS style */
  bottomSheet: {
    damping: 50,
    stiffness: 500,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
};

// ============================================
// Timing Presets (Reanimated 2/3)
// ============================================

export const TimingPresets = {
  /** Quick fade/scale (150ms) */
  fast: {
    duration: 150,
    easing: ReanimatedEasing.bezier(0.25, 0.1, 0.25, 1),
  },

  /** Standard transitions (250ms) */
  normal: {
    duration: 250,
    easing: ReanimatedEasing.bezier(0.4, 0.0, 0.2, 1),
  },

  /** Slow, deliberate transitions (350ms) */
  slow: {
    duration: 300,
    easing: ReanimatedEasing.bezier(0.4, 0.0, 0.2, 1),
  },

  /** Ease out - entering elements */
  easeOut: {
    duration: 250,
    easing: ReanimatedEasing.bezier(0.0, 0.0, 0.2, 1),
  },

  /** Ease in - exiting elements */
  easeIn: {
    duration: 200,
    easing: ReanimatedEasing.bezier(0.4, 0.0, 1.0, 1),
  },
};

// ============================================
// Animated API Presets (Legacy)
// ============================================

export const AnimatedPresets = {
  /** Fade in animation */
  fadeIn: (value: Animated.Value, duration = 250) => {
    return Animated.timing(value, {
      toValue: 1,
      duration,
      easing: Easing.bezier(0.0, 0.0, 0.2, 1),
      useNativeDriver: true,
    });
  },

  /** Fade out animation */
  fadeOut: (value: Animated.Value, duration = 200) => {
    return Animated.timing(value, {
      toValue: 0,
      duration,
      easing: Easing.bezier(0.4, 0.0, 1.0, 1),
      useNativeDriver: true,
    });
  },

  /** Scale press animation */
  pressIn: (value: Animated.Value, toValue = 0.96) => {
    return Animated.spring(value, {
      toValue,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    });
  },

  /** Scale release animation */
  pressOut: (value: Animated.Value) => {
    return Animated.spring(value, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    });
  },

  /** Slide in from bottom */
  slideInUp: (value: Animated.Value, _distance = 100, duration = 300) => {
    return Animated.timing(value, {
      toValue: 0,
      duration,
      easing: Easing.bezier(0.0, 0.0, 0.2, 1),
      useNativeDriver: true,
    });
  },

  /** Slide out to bottom */
  slideOutDown: (value: Animated.Value, distance = 100, duration = 250) => {
    return Animated.timing(value, {
      toValue: distance,
      duration,
      easing: Easing.bezier(0.4, 0.0, 1.0, 1),
      useNativeDriver: true,
    });
  },
};

// ============================================
// Reanimated Helper Functions
// ============================================

/**
 * Creates a spring animation to a value
 */
export function springTo(value: number, preset: keyof typeof SpringPresets = 'default') {
  return withSpring(value, SpringPresets[preset]);
}

/**
 * Creates a timing animation to a value
 */
export function timingTo(value: number, preset: keyof typeof TimingPresets = 'normal') {
  return withTiming(value, TimingPresets[preset]);
}

/**
 * Creates a pulse animation (scale up then back)
 */
export function pulse(fromValue = 1, toValue = 1.1, preset: keyof typeof SpringPresets = 'bouncy') {
  return withSequence(
    withSpring(toValue, SpringPresets[preset]),
    withSpring(fromValue, SpringPresets[preset])
  );
}

/**
 * Creates a shake animation (horizontal)
 */
export function shake(amplitude = 10, count = 3) {
  return withSequence(
    ...Array(count)
      .fill(null)
      .flatMap(() => [
        withTiming(amplitude, { duration: 50 }),
        withTiming(-amplitude, { duration: 100 }),
        withTiming(0, { duration: 50 }),
      ])
  );
}

/**
 * Creates a breathing animation
 */
export function breathe(fromValue = 1, toValue = 1.05, duration = 2000) {
  return withRepeat(
    withSequence(
      withTiming(toValue, { duration: duration / 2 }),
      withTiming(fromValue, { duration: duration / 2 })
    ),
    -1,
    true
  );
}
