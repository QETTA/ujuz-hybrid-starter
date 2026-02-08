/**
 * Design System - Typography
 *
 * 일관된 타이포그래피 스타일을 제공합니다.
 */

export const Typography = {
  // Display (큰 제목)
  display: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.25,
  },

  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },

  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },

  // Body Text (iOS HIG: 17pt body, 22pt line height)
  body1: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.4, // iOS standard tracking
  },

  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // UI Elements
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },

  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Small Text
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  overline: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // Link
  link: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0,
    textDecorationLine: 'underline' as const,
  },

  // Label
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const;

export type TypographyVariant = keyof typeof Typography;

export default Typography;
