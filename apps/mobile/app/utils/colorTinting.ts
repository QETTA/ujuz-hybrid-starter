/**
 * Color Tinting Utilities (iOS 28.2 Adaptive Colors)
 *
 * iOS 28.2 Features:
 * - RGB color mixing (like CSS color-mix)
 * - Tinted backgrounds for visual hierarchy
 * - Vibrant overlays with adaptive opacity
 * - Dynamic color generation from images
 */

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

interface RGB {
  r: number;
  g: number;
  b: number;
}

// RGBA interface reserved for future use
// interface _RGBA extends RGB { a: number; }

// ═══════════════════════════════════════════════════════════
// PARSING FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Parse hex color to RGB
 * @param hex - Hex color string (#RGB, #RRGGBB, or #RRGGBBAA)
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle shorthand (#RGB)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const bigint = parseInt(hex.slice(0, 6), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to rgba string
 */
export function rgbToRgba(rgb: RGB, alpha: number = 1): string {
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
}

/**
 * Parse any color format to RGB
 * Supports: #hex, rgb(), rgba()
 */
export function parseColor(color: string): RGB {
  // Hex format
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // rgb() or rgba() format
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  // Default to black if parsing fails
  console.warn(`Could not parse color: ${color}`);
  return { r: 0, g: 0, b: 0 };
}

// ═══════════════════════════════════════════════════════════
// COLOR MIXING (iOS 28.2 color-mix equivalent)
// ═══════════════════════════════════════════════════════════

/**
 * Mix two colors together (like CSS color-mix)
 * @param color1 - First color (hex or rgb)
 * @param color2 - Second color (hex or rgb)
 * @param amount - Mix ratio 0-1 (0 = all color1, 1 = all color2)
 * @returns Hex color string
 */
export function mixColors(color1: string, color2: string, amount: number = 0.5): string {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  const mixed: RGB = {
    r: rgb1.r + (rgb2.r - rgb1.r) * amount,
    g: rgb1.g + (rgb2.g - rgb1.g) * amount,
    b: rgb1.b + (rgb2.b - rgb1.b) * amount,
  };

  return rgbToHex(mixed);
}

/**
 * Create a tinted background color
 * Mixes accent color with base (typically white/gray) at low ratio
 * @param accentColor - The accent color to tint with
 * @param baseColor - The base background color (default: #F2F2F7 iOS gray)
 * @param tintAmount - How much accent to add (0.05-0.15 typical)
 */
export function createTintedBackground(
  accentColor: string,
  baseColor: string = '#F2F2F7',
  tintAmount: number = 0.1
): string {
  return mixColors(baseColor, accentColor, tintAmount);
}

// ═══════════════════════════════════════════════════════════
// COLOR MANIPULATION
// ═══════════════════════════════════════════════════════════

/**
 * Lighten a color by percentage
 * @param color - Input color
 * @param amount - Amount to lighten (0-1)
 */
export function lighten(color: string, amount: number): string {
  const rgb = parseColor(color);
  return rgbToHex({
    r: rgb.r + (255 - rgb.r) * amount,
    g: rgb.g + (255 - rgb.g) * amount,
    b: rgb.b + (255 - rgb.b) * amount,
  });
}

/**
 * Darken a color by percentage
 * @param color - Input color
 * @param amount - Amount to darken (0-1)
 */
export function darken(color: string, amount: number): string {
  const rgb = parseColor(color);
  return rgbToHex({
    r: rgb.r * (1 - amount),
    g: rgb.g * (1 - amount),
    b: rgb.b * (1 - amount),
  });
}

/**
 * Adjust saturation of a color
 * @param color - Input color
 * @param amount - Saturation adjustment (-1 to 1)
 */
export function adjustSaturation(color: string, amount: number): string {
  const rgb = parseColor(color);
  const gray = 0.2989 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;

  return rgbToHex({
    r: rgb.r + (rgb.r - gray) * amount,
    g: rgb.g + (rgb.g - gray) * amount,
    b: rgb.b + (rgb.b - gray) * amount,
  });
}

/**
 * Get a contrasting text color (black or white) for a background
 * @param backgroundColor - The background color
 * @returns '#000000' or '#FFFFFF'
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = parseColor(backgroundColor);
  // Using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// ═══════════════════════════════════════════════════════════
// iOS 28.2 ADAPTIVE COLORS
// ═══════════════════════════════════════════════════════════

/**
 * iOS 28.2 Adaptive Color Palette
 * Pre-computed tinted backgrounds for common use cases
 */
export const AdaptiveColors = {
  // Tinted backgrounds (10% accent color)
  tinted: {
    primary: createTintedBackground('#007AFF', '#F2F2F7', 0.1),
    success: createTintedBackground('#34C759', '#F2F2F7', 0.1),
    warning: createTintedBackground('#FF9500', '#F2F2F7', 0.1),
    danger: createTintedBackground('#FF3B30', '#F2F2F7', 0.1),
    purple: createTintedBackground('#AF52DE', '#F2F2F7', 0.1),
    pink: createTintedBackground('#FF2D55', '#F2F2F7', 0.1),
  },

  // Vibrant overlays (higher opacity accent)
  vibrant: {
    light: 'rgba(255, 255, 255, 0.95)',
    dark: 'rgba(0, 0, 0, 0.75)',
    primaryLight: 'rgba(0, 122, 255, 0.12)',
    primaryMedium: 'rgba(0, 122, 255, 0.2)',
    successLight: 'rgba(52, 199, 89, 0.12)',
    warningLight: 'rgba(255, 149, 0, 0.12)',
    dangerLight: 'rgba(255, 59, 48, 0.12)',
  },

  // Material backgrounds (iOS system colors with transparency)
  material: {
    ultraThinLight: 'rgba(255, 255, 255, 0.5)',
    thinLight: 'rgba(255, 255, 255, 0.75)',
    regularLight: 'rgba(255, 255, 255, 0.85)',
    thickLight: 'rgba(255, 255, 255, 0.95)',
    ultraThinDark: 'rgba(0, 0, 0, 0.4)',
    thinDark: 'rgba(0, 0, 0, 0.6)',
    regularDark: 'rgba(0, 0, 0, 0.75)',
    thickDark: 'rgba(0, 0, 0, 0.9)',
  },

  // Gradient stops
  gradients: {
    primaryToSecondary: ['#007AFF', '#5856D6'],
    successGradient: ['#34C759', '#30D158'],
    warmGradient: ['#FF9500', '#FF2D55'],
    coolGradient: ['#5AC8FA', '#007AFF'],
    neutralGradient: ['#8E8E93', '#636366'],
  },
} as const;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Create a complete color scheme from a single accent color
 * @param accentColor - The primary accent color
 */
export function createColorScheme(accentColor: string) {
  return {
    primary: accentColor,
    primaryLight: lighten(accentColor, 0.3),
    primaryDark: darken(accentColor, 0.2),
    tintedBackground: createTintedBackground(accentColor),
    subtleBackground: createTintedBackground(accentColor, '#FFFFFF', 0.05),
    contrastText: getContrastColor(accentColor),
    vibrantOverlay: rgbToRgba(parseColor(accentColor), 0.15),
  };
}

/**
 * Get iOS system color by name
 */
export const iOSColors = {
  blue: '#007AFF',
  green: '#34C759',
  indigo: '#5856D6',
  orange: '#FF9500',
  pink: '#FF2D55',
  purple: '#AF52DE',
  red: '#FF3B30',
  teal: '#5AC8FA',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',
} as const;

export default {
  hexToRgb,
  rgbToHex,
  rgbToRgba,
  parseColor,
  mixColors,
  createTintedBackground,
  lighten,
  darken,
  adjustSaturation,
  getContrastColor,
  createColorScheme,
  AdaptiveColors,
  iOSColors,
};
