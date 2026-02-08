/**
 * TamaguiChip - Interactive Chip 컴포넌트
 *
 * 2026 Design System: 선택 가능한 칩/태그
 * - Filled, outlined, soft variants
 * - Selectable with animation
 * - Removable with close button
 * - Light/Dark 모드 자동 지원
 */

import React from 'react';
import { styled, XStack, Text, GetProps } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/app/constants/Colors';

// Styled Chip Container
const ChipContainer = styled(XStack, {
  name: 'Chip',
  alignItems: 'center',
  borderRadius: 9999,
  gap: '$1',

  // Press animation
  pressStyle: {
    scale: 0.95,
    opacity: 0.9,
  },

  variants: {
    // Style variants
    variant: {
      filled: {
        backgroundColor: '$primary',
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      soft: {
        backgroundColor: '$primaryLight',
      },
      glass: {
        backgroundColor: '$glassMedium',
        borderWidth: 1,
        borderColor: '$glassDark',
      },
      premium: {
        backgroundColor: '$premiumBg',
        borderWidth: 1,
        borderColor: '$premium',
      },
      deal: {
        backgroundColor: '$dealBg',
        borderWidth: 1,
        borderColor: '$deal',
      },
    },

    // Size variants
    size: {
      sm: {
        paddingHorizontal: '$2',
        paddingVertical: '$1',
        height: 28,
      },
      md: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
        height: 36,
      },
      lg: {
        paddingHorizontal: '$4',
        paddingVertical: '$3',
        height: 44,
      },
    },

    // Selected state
    selected: {
      true: {
        backgroundColor: '$primary',
        borderColor: '$primary',
      },
    },

    // Disabled state
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'outlined',
    size: 'md',
  },
});

// Styled Chip Text
const ChipText = styled(Text, {
  name: 'ChipText',
  fontWeight: '500',

  variants: {
    variant: {
      filled: {
        color: '$textInverse',
      },
      outlined: {
        color: '$textPrimary',
      },
      soft: {
        color: '$primary',
      },
      glass: {
        color: '$textPrimary',
      },
      premium: {
        color: '$premium',
      },
      deal: {
        color: '$deal',
      },
    },

    size: {
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 16 },
    },

    selected: {
      true: {
        color: '$textInverse',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'outlined',
    size: 'md',
  },
});

// Props types
export type ChipVariant = 'filled' | 'outlined' | 'soft' | 'glass' | 'premium' | 'deal';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface TamaguiChipProps {
  /** Chip label */
  label: string;
  /** Style variant */
  variant?: ChipVariant;
  /** Size */
  size?: ChipSize;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Left icon name (Ionicons) */
  leftIcon?: string;
  /** Show remove button */
  removable?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Remove handler */
  onRemove?: () => void;
  /** Enable haptics */
  haptics?: boolean;
  /** Test ID */
  testID?: string;
}

export function TamaguiChip({
  label,
  variant = 'outlined',
  size = 'md',
  selected = false,
  disabled = false,
  leftIcon,
  removable = false,
  onPress,
  onRemove,
  haptics = true,
  testID,
}: TamaguiChipProps) {
  const handlePress = () => {
    if (!disabled && onPress) {
      if (haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const handleRemove = () => {
    if (!disabled && onRemove) {
      if (haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onRemove();
    }
  };

  // Determine icon/text colors based on state
  const getIconColor = () => {
    if (selected || variant === 'filled') return Colors.white;
    if (variant === 'soft') return Colors.link;
    return Colors.textSecondary;
  };

  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  return (
    <ChipContainer
      variant={variant}
      size={size}
      selected={selected}
      disabled={disabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      testID={testID}
    >
      {/* Left Icon */}
      {leftIcon && <Ionicons name={leftIcon as any} size={iconSize} color={getIconColor()} />}

      {/* Label */}
      <ChipText variant={variant} size={size} selected={selected}>
        {label}
      </ChipText>

      {/* Remove Button */}
      {removable && (
        <XStack
          onPress={handleRemove}
          marginLeft="$1"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={iconSize} color={getIconColor()} />
        </XStack>
      )}
    </ChipContainer>
  );
}

// Chip Group for multiple selections
export interface TamaguiChipGroupProps {
  /** Children (Chip components) */
  children: React.ReactNode;
  /** Gap between chips */
  gap?: number;
  /** Wrap chips */
  wrap?: boolean;
}

export function TamaguiChipGroup({ children, gap = 8, wrap = true }: TamaguiChipGroupProps) {
  return (
    <XStack gap={gap as any} flexWrap={wrap ? 'wrap' : 'nowrap'}>
      {children}
    </XStack>
  );
}

// Type exports
export type { GetProps };

export default TamaguiChip;
