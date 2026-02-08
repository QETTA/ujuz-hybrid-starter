/**
 * TamaguiCard - Tamagui 기반 Card 컴포넌트
 *
 * 기존 Card와 동일한 Props 인터페이스 유지
 * 점진적 마이그레이션을 위해 drop-in replacement 가능
 */

import React from 'react';
import { styled, YStack, GetProps } from 'tamagui';
import * as Haptics from 'expo-haptics';

// Styled Tamagui Card with variants
const StyledCard = styled(YStack, {
  name: 'UJUzCard',
  borderRadius: 16,
  overflow: 'hidden',

  variants: {
    variant: {
      elevated: {
        backgroundColor: '$card',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      outlined: {
        backgroundColor: '$card',
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      filled: {
        backgroundColor: '$surface',
      },
    },

    noPadding: {
      true: {
        padding: 0,
      },
      false: {
        padding: 16,
      },
    },

    pressable: {
      true: {
        pressStyle: {
          opacity: 0.7,
          scale: 0.99,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'elevated',
    noPadding: false,
  },
});

// Props types
export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface TamaguiCardProps {
  /** Card variant */
  variant?: CardVariant;
  /** Press handler - makes card pressable */
  onPress?: () => void;
  /** Children */
  children: React.ReactNode;
  /** No padding */
  noPadding?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Test ID */
  testID?: string;
}

export default function TamaguiCard({
  variant = 'elevated',
  onPress,
  children,
  noPadding = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: TamaguiCardProps) {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  if (onPress) {
    return (
      <StyledCard
        variant={variant}
        noPadding={noPadding}
        pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        {children}
      </StyledCard>
    );
  }

  return (
    <StyledCard
      variant={variant}
      noPadding={noPadding}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint || 'Card content'}
      testID={testID}
    >
      {children}
    </StyledCard>
  );
}

// Re-export types for convenience
export type { GetProps };
