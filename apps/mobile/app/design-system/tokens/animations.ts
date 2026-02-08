/**
 * Design System - Animation Tokens
 *
 * iOS 28.2 + 2026 트렌드: Advanced Spring Physics & Micro-interactions
 */

export const Animations = {
  // Duration (ms) - iOS 28 optimized
  duration: {
    instant: 0,
    micro: 100, // NEW: Micro-interactions
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    modal: 400, // NEW: Modal transitions
  },

  // Easing curves - iOS 28 native feel
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy spring
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material smooth
    ios28: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // NEW: iOS 28 native
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // NEW: Decelerate
  },

  // ═══════════════════════════════════════════════════════════
  // iOS 28.2 SPRING PHYSICS - Advanced Presets
  // ═══════════════════════════════════════════════════════════

  // Default spring (balanced)
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Bouncy spring (playful)
  springBouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.5,
  },

  // Smooth spring (elegant)
  springSmooth: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },

  // NEW: iOS 28.2 Fluid Motion - Natural, organic feel
  springFluid: {
    damping: 18,
    stiffness: 180,
    mass: 0.9,
    velocity: 0,
  },

  // NEW: iOS 28.2 Snappy - Quick, responsive interactions
  springSnappy: {
    damping: 12,
    stiffness: 220,
    mass: 0.7,
    velocity: 2,
  },

  // NEW: iOS 28.2 Card Slide - Ultra-smooth card transitions
  springCardSlide: {
    damping: 22,
    stiffness: 140,
    mass: 1.1,
    velocity: 0,
  },

  // NEW: iOS 28.2 Sheet - Native bottom sheet feel
  springSheet: {
    damping: 35,
    stiffness: 400,
    mass: 0.8,
    velocity: 0,
  },

  // NEW: iOS 28.2 Rubber Band - Overscroll bounce
  springRubberBand: {
    damping: 30,
    stiffness: 500,
    mass: 0.6,
    velocity: 0,
  },

  // NEW: iOS 28.2 Button Press - Micro-interaction feedback
  springButton: {
    damping: 14,
    stiffness: 250,
    mass: 0.6,
    velocity: 0,
  },

  // ═══════════════════════════════════════════════════════════
  // SCALE PRESETS - iOS 28.2 Micro-interactions
  // ═══════════════════════════════════════════════════════════

  scale: {
    pressIn: 0.985, // Subtle press (restrained motion)
    cardTap: 0.99, // Card touch feedback (minimal)
    chipActive: 1.02, // Selected chip expansion (restrained)
    iconPop: 1.08, // Icon emphasis (lowered)
    minimal: 0.995, // Subtle feedback
  },

  // ═══════════════════════════════════════════════════════════
  // GLOW EFFECTS - iOS 28.2 Visual feedback
  // ═══════════════════════════════════════════════════════════

  glow: {
    button: {
      color: '#007AFF',
      opacity: 0.18,
      radius: 14,
    },
    card: {
      color: '#000000',
      opacity: 0.05,
      radius: 16,
    },
    success: {
      color: '#34C759',
      opacity: 0.18,
      radius: 12,
    },
  },

  // Shimmer loading animation
  shimmer: {
    duration: 1500,
    colors: ['#f0f0f0', '#e0e0e0', '#f0f0f0'],
  },
} as const;

export type AnimationDuration = keyof typeof Animations.duration;
export type AnimationEasing = keyof typeof Animations.easing;

export default Animations;
