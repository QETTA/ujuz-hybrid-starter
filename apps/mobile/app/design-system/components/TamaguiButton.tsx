/**
 * TamaguiButton - Tamagui 기반 Button 컴포넌트
 *
 * 기존 Button과 동일한 Props 인터페이스 유지
 * 점진적 마이그레이션을 위해 drop-in replacement 가능
 *
 * 2026 Design System: 테마 인식 로더, Light/Dark 모드 자동 지원
 */

import React from 'react';
import { ActivityIndicator } from 'react-native';
import { styled, Button as TButton, XStack, Text, GetProps, useTheme } from 'tamagui';
import * as Haptics from 'expo-haptics';

// Styled Tamagui Button with variants
const StyledButton = styled(TButton, {
  name: 'UJUzButton',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  pressStyle: {
    opacity: 0.8,
    scale: 0.98,
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      secondary: {
        backgroundColor: '$secondary',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '$primary',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      success: {
        backgroundColor: '$success',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      warning: {
        backgroundColor: '$warning',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      danger: {
        backgroundColor: '$error',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    },

    size: {
      xs: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        minHeight: 32,
        borderRadius: 12,
      },
      sm: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 40,
        borderRadius: 16,
      },
      md: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        minHeight: 44,
        borderRadius: 16,
      },
      lg: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        minHeight: 52,
        borderRadius: 20,
      },
      xl: {
        paddingHorizontal: 40,
        paddingVertical: 18,
        minHeight: 60,
        borderRadius: 24,
      },
    },

    fullWidth: {
      true: {
        width: '100%',
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// Styled Text for button content - 테마 토큰 사용
const ButtonText = styled(Text, {
  name: 'UJUzButtonText',
  textAlign: 'center',
  fontWeight: '600',

  variants: {
    variant: {
      primary: {
        color: '$textInverse',
      },
      secondary: {
        color: '$textInverse',
      },
      outline: {
        color: '$primary',
      },
      ghost: {
        color: '$primary',
      },
      success: {
        color: '$textInverse',
      },
      warning: {
        color: '$textInverse',
      },
      danger: {
        color: '$textInverse',
      },
    },

    size: {
      xs: {
        fontSize: 12,
        lineHeight: 16,
      },
      sm: {
        fontSize: 14,
        lineHeight: 20,
      },
      md: {
        fontSize: 16,
        lineHeight: 24,
      },
      lg: {
        fontSize: 18,
        lineHeight: 24,
      },
      xl: {
        fontSize: 20,
        lineHeight: 28,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// Props types
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TamaguiButtonProps {
  /** Button content */
  children: string;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

export default function TamaguiButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onPress,
  testID,
}: TamaguiButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  // 2026: 테마 인식 로더 색상
  const getLoaderColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return theme.primary.val;
    }
    // primary, secondary, success, warning, danger use white text
    return theme.textInverse.val;
  };

  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={loading ? 'Loading, please wait' : undefined}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLoaderColor()} />
      ) : (
        <XStack alignItems="center" gap="$2">
          {leftIcon}
          <ButtonText variant={variant} size={size}>
            {children}
          </ButtonText>
          {rightIcon}
        </XStack>
      )}
    </StyledButton>
  );
}

// Re-export types for convenience
export type { GetProps };
