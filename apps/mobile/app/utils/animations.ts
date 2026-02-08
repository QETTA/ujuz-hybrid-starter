/**
 * Animation Utilities - iOS 26 Style
 *
 * Smooth, natural animations following iOS design guidelines
 */

import { Easing } from 'react-native';

export const AnimationConfig = {
  // Durations (in ms)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },

  // Easing curves - iOS style
  easing: {
    // Standard ease in-out (most common)
    standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),

    // Decelerate (ease out)
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),

    // Accelerate (ease in)
    accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),

    // Sharp (quick in and out)
    sharp: Easing.bezier(0.4, 0.0, 0.6, 1.0),

    // Bounce (iOS spring-like)
    bounce: Easing.bezier(0.68, -0.55, 0.27, 1.55),
  },

  // Spring configurations (for react-native-reanimated)
  spring: {
    gentle: {
      damping: 20,
      stiffness: 90,
      mass: 1,
    },
    standard: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
      mass: 0.8,
    },
  },

  // Layout animation presets
  layout: {
    easeInEaseOut: {
      duration: 250,
      update: {
        type: 'easeInEaseOut' as const,
        property: 'opacity' as const,
      },
      delete: {
        type: 'easeInEaseOut' as const,
        property: 'opacity' as const,
      },
    },
    spring: {
      duration: 350,
      update: {
        type: 'spring' as const,
        springDamping: 0.7,
      },
      delete: {
        type: 'easeInEaseOut' as const,
        property: 'opacity' as const,
      },
    },
  },
};

/**
 * Fade In Animation Config
 */
export const fadeIn = {
  duration: AnimationConfig.duration.normal,
  easing: AnimationConfig.easing.decelerate,
};

/**
 * Fade Out Animation Config
 */
export const fadeOut = {
  duration: AnimationConfig.duration.fast,
  easing: AnimationConfig.easing.accelerate,
};

/**
 * Slide Up Animation Config
 */
export const slideUp = {
  duration: AnimationConfig.duration.normal,
  easing: AnimationConfig.easing.standard,
};

/**
 * Slide Down Animation Config
 */
export const slideDown = {
  duration: AnimationConfig.duration.normal,
  easing: AnimationConfig.easing.standard,
};

/**
 * Scale Animation Config
 */
export const scale = {
  duration: AnimationConfig.duration.fast,
  easing: AnimationConfig.easing.sharp,
};

/**
 * Helper: Create animated value with spring
 */
export function createSpringAnimation(
  toValue: number,
  config: 'gentle' | 'standard' | 'bouncy' = 'standard'
) {
  return {
    toValue,
    ...AnimationConfig.spring[config],
  };
}

/**
 * Helper: Create animated value with timing
 */
export function createTimingAnimation(
  toValue: number,
  duration: number = AnimationConfig.duration.normal,
  easing = AnimationConfig.easing.standard
) {
  return {
    toValue,
    duration,
    easing,
  };
}
