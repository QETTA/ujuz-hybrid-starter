/**
 * TamaguiText - Variable Typography 컴포넌트
 *
 * 2026 Design System: 통합 Typography Scale
 * - preset variants로 일관된 타이포그래피
 * - color variants로 의미론적 색상
 * - Light/Dark 모드 자동 지원
 */

import { styled, Text, GetProps } from 'tamagui';

// Styled Text with comprehensive variants
export const TamaguiText = styled(Text, {
  name: 'TamaguiText',
  color: '$textPrimary',
  fontFamily: '$body',

  variants: {
    // Typography Preset Variants
    preset: {
      display: {
        fontSize: 40,
        fontWeight: '700',
        lineHeight: 48,
        letterSpacing: -0.8,
        fontFamily: '$heading',
      },
      h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        letterSpacing: -0.5,
        fontFamily: '$heading',
      },
      h2: {
        fontSize: 28,
        fontWeight: '600',
        lineHeight: 36,
        letterSpacing: -0.4,
        fontFamily: '$heading',
      },
      h3: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: -0.3,
        fontFamily: '$heading',
      },
      h4: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        letterSpacing: -0.2,
        fontFamily: '$heading',
      },
      bodyLarge: {
        fontSize: 17,
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: -0.4,
      },
      body: {
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 22,
        letterSpacing: -0.3,
      },
      bodySmall: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 18,
        letterSpacing: -0.2,
      },
      button: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 20,
        letterSpacing: 0,
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
        letterSpacing: 0,
      },
      caption: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        letterSpacing: 0.2,
      },
      overline: {
        fontSize: 11,
        fontWeight: '600',
        lineHeight: 14,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      },
      label: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
        letterSpacing: 0,
      },
    },

    // Color Variants (renamed to avoid conflict with native color prop)
    textColor: {
      primary: { color: '$textPrimary' },
      secondary: { color: '$textSecondary' },
      tertiary: { color: '$textTertiary' },
      inverse: { color: '$textInverse' },
      muted: { color: '$textMuted' },
      brand: { color: '$primary' },
      success: { color: '$success' },
      warning: { color: '$warning' },
      error: { color: '$error' },
      info: { color: '$info' },
      link: { color: '$textLink' },
    },

    // Text Alignment
    align: {
      left: { textAlign: 'left' },
      center: { textAlign: 'center' },
      right: { textAlign: 'right' },
    },

    // Weight Override
    weight: {
      regular: { fontWeight: '400' },
      medium: { fontWeight: '500' },
      semibold: { fontWeight: '600' },
      bold: { fontWeight: '700' },
    },

    // Truncation
    truncate: {
      true: {
        overflow: 'hidden',
        // Note: numberOfLines should be passed as prop
      },
    },
  } as const,

  defaultVariants: {
    preset: 'body',
    textColor: 'primary',
  },
});

// Type exports
export type TamaguiTextProps = GetProps<typeof TamaguiText>;

export default TamaguiText;
