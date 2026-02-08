/**
 * TamaguiDivider - Divider 컴포넌트
 *
 * 2026 Design System: 콘텐츠 구분선
 * - Solid, dashed variants
 * - Vertical/horizontal orientation
 * - Label support
 * - Light/Dark 모드 자동 지원
 */

import { styled, YStack, XStack, Text, GetProps } from 'tamagui';

// Styled Divider Line
const DividerLine = styled(YStack, {
  name: 'DividerLine',
  backgroundColor: '$borderColor',

  variants: {
    // Orientation
    orientation: {
      horizontal: {
        height: 1,
        width: '100%',
      },
      vertical: {
        width: 1,
        height: '100%',
      },
    },

    // Spacing (margin)
    spacing: {
      none: {},
      sm: {},
      md: {},
      lg: {},
    },

    // Variant style
    variant: {
      solid: {},
      dashed: {
        backgroundColor: 'transparent',
        borderStyle: 'dashed',
        borderColor: '$borderColor',
      },
      light: {
        backgroundColor: '$borderColor',
        opacity: 0.5,
      },
    },
  } as const,

  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
    spacing: 'none',
  },
});

// Styled Label Text
const DividerLabel = styled(Text, {
  name: 'DividerLabel',
  fontSize: 12,
  fontWeight: '500',
  color: '$textTertiary',
  paddingHorizontal: '$3',
  backgroundColor: '$background',
});

// Props types
export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerSpacing = 'none' | 'sm' | 'md' | 'lg';
export type DividerVariant = 'solid' | 'dashed' | 'light';

export interface TamaguiDividerProps {
  /** Orientation */
  orientation?: DividerOrientation;
  /** Spacing (margin) */
  spacing?: DividerSpacing;
  /** Style variant */
  variant?: DividerVariant;
  /** Optional label text */
  label?: string;
  /** Test ID */
  testID?: string;
}

// Spacing values mapping
const SPACING_VALUES = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
} as const;

export function TamaguiDivider({
  orientation = 'horizontal',
  spacing = 'none',
  variant = 'solid',
  label,
  testID,
}: TamaguiDividerProps) {
  const spacingValue = SPACING_VALUES[spacing];
  const isHorizontal = orientation === 'horizontal';

  // Divider with label
  if (label && isHorizontal) {
    return (
      <XStack
        alignItems="center"
        marginVertical={spacingValue}
        testID={testID}
        accessibilityRole="none"
      >
        <DividerLine orientation="horizontal" variant={variant} flex={1} />
        <DividerLabel>{label}</DividerLabel>
        <DividerLine orientation="horizontal" variant={variant} flex={1} />
      </XStack>
    );
  }

  // Simple divider
  return (
    <DividerLine
      orientation={orientation}
      variant={variant}
      marginVertical={isHorizontal ? spacingValue : undefined}
      marginHorizontal={!isHorizontal ? spacingValue : undefined}
      testID={testID}
      accessibilityRole="none"
      style={
        variant === 'dashed'
          ? {
              borderTopWidth: isHorizontal ? 1 : 0,
              borderLeftWidth: !isHorizontal ? 1 : 0,
            }
          : undefined
      }
    />
  );
}

// Type exports
export type { GetProps };

export default TamaguiDivider;
