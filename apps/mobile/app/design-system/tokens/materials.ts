/**
 * Design System - Materials (iOS 28.2 Glassmorphism 2.0)
 *
 * iOS 28.2 Depth Layers:
 * - Enhanced glassmorphism with blur + saturation
 * - Adaptive depth system (flat → elevated)
 * - Material tints for visual hierarchy
 * - Subtle borders for definition
 */

// ═══════════════════════════════════════════════════════════
// GLASS MATERIALS - iOS 28.2 Glassmorphism System
// ═══════════════════════════════════════════════════════════

export const Glass = {
  /**
   * Ultra Thin Glass - Barely visible, maximum transparency
   * Use: Floating overlays, status bars
   */
  ultraThin: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    blur: 12,
    saturation: 150,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  /**
   * Thin Glass - Light frosted effect
   * Use: Navigation bars, tab bars
   */
  thin: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    blur: 20,
    saturation: 160,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  /**
   * Medium Glass - Standard frosted glass (Most Common)
   * Use: Cards, sheets, modals
   */
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    blur: 24,
    saturation: 180,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  /**
   * Thick Glass - Heavy frosted effect
   * Use: Alert dialogs, prominent cards
   */
  thick: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    blur: 32,
    saturation: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Dark mode variants
  dark: {
    ultraThin: {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      blur: 12,
      saturation: 150,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    thin: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      blur: 20,
      saturation: 160,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    medium: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      blur: 24,
      saturation: 180,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    thick: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      blur: 32,
      saturation: 200,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════
// DEPTH LAYERS - iOS 28.2 Elevation System
// ═══════════════════════════════════════════════════════════

export const Depths = {
  /**
   * Flat - No elevation
   * Use: Background surfaces, dividers
   */
  flat: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  /**
   * Raised - Subtle lift
   * Use: Buttons, chips, input fields
   */
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  /**
   * Floating - Medium elevation (iOS 28.2 NEW)
   * Use: Cards, list items, floating UI
   */
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  /**
   * Elevated - High prominence
   * Use: Modals, bottom sheets, dialogs
   */
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  /**
   * Lifted - Maximum elevation (iOS 28.2 NEW)
   * Use: FABs, important CTAs, alerts
   */
  lifted: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// GLOW SHADOWS - iOS 28.2 Colored Depth
// ═══════════════════════════════════════════════════════════

export const Glows = {
  /**
   * Primary Glow - Blue accent
   * Use: Primary buttons on press, CTAs
   */
  primary: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },

  /**
   * Success Glow - Green accent
   * Use: Confirmation buttons, success states
   */
  success: {
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  /**
   * Warning Glow - Orange accent
   * Use: Warning buttons, attention states
   */
  warning: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  /**
   * Danger Glow - Red accent
   * Use: Delete buttons, error states
   */
  danger: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  /**
   * Subtle Glow - Neutral
   * Use: Cards on hover, subtle emphasis
   */
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// ═══════════════════════════════════════════════════════════
// BORDER STYLES - iOS 28.2 Definition System
// ═══════════════════════════════════════════════════════════

export const Borders = {
  /**
   * Hairline - Ultra thin separator
   * Use: List dividers, subtle separations
   */
  hairline: {
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },

  /**
   * Light - Standard subtle border
   * Use: Card outlines, input fields
   */
  light: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },

  /**
   * Glass - Glassmorphism edge
   * Use: Glass surfaces, floating UI
   */
  glass: {
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  /**
   * Focus - Input focus state
   * Use: Focused inputs, selected items
   */
  focus: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
} as const;

// ═══════════════════════════════════════════════════════════
// HELPER: Create Platform-specific Glass Style
// ═══════════════════════════════════════════════════════════

export function createGlassStyle(
  variant: 'ultraThin' | 'thin' | 'medium' | 'thick' = 'medium',
  depth: keyof typeof Depths = 'floating'
) {
  const glass = Glass[variant];
  const depthStyle = Depths[depth];

  return {
    backgroundColor: glass.backgroundColor,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    ...depthStyle,
    // Note: backdropFilter not supported in React Native
    // Use BlurView from @react-native-community/blur for actual blur
  };
}

// ═══════════════════════════════════════════════════════════
// MATERIAL PRESETS - Common Combinations
// ═══════════════════════════════════════════════════════════

export const MaterialPresets = {
  /**
   * Card - Standard floating card
   */
  card: {
    ...createGlassStyle('medium', 'floating'),
    borderRadius: 16,
  },

  /**
   * Sheet - Bottom sheet modal
   */
  sheet: {
    // Restrained glass: prefer medium in core flows
    ...createGlassStyle('medium', 'elevated'),
    borderRadius: 24,
  },

  /**
   * Chip - Filter chip, tag
   */
  chip: {
    ...createGlassStyle('thin', 'raised'),
    borderRadius: 20,
  },

  /**
   * FAB - Floating action button
   */
  fab: {
    ...Depths.lifted,
    backgroundColor: '#007AFF',
    borderRadius: 28,
  },

  /**
   * NavBar - Navigation bar
   */
  navBar: {
    ...createGlassStyle('thin', 'raised'),
    borderRadius: 0,
  },

  /**
   * Toast - Notification toast
   */
  toast: {
    // Restrained glass: prefer medium in core flows
    ...createGlassStyle('medium', 'elevated'),
    borderRadius: 12,
  },
} as const;

export type GlassVariant = keyof typeof Glass;
export type DepthVariant = keyof typeof Depths;
export type GlowVariant = keyof typeof Glows;

export const Materials = {
  Glass,
  Depths,
  Glows,
  Borders,
  Presets: MaterialPresets,
  createGlassStyle,
} as const;

export default Materials;
