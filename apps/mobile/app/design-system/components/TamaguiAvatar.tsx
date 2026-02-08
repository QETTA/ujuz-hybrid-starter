/**
 * TamaguiAvatar - Avatar 컴포넌트
 *
 * 2026 Design System: 사용자/장소 아바타
 * - Size variants
 * - Status indicator
 * - Gradient ring support
 * - Light/Dark 모드 자동 지원
 */

import { Image } from 'react-native';
import { styled, YStack, Text, GetProps } from 'tamagui';

// Avatar sizes in pixels
const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

// Styled Avatar Container
const AvatarContainer = styled(YStack, {
  name: 'Avatar',
  borderRadius: 9999,
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$surfaceElevated',

  variants: {
    // Size variants
    size: {
      xs: { width: AVATAR_SIZES.xs, height: AVATAR_SIZES.xs },
      sm: { width: AVATAR_SIZES.sm, height: AVATAR_SIZES.sm },
      md: { width: AVATAR_SIZES.md, height: AVATAR_SIZES.md },
      lg: { width: AVATAR_SIZES.lg, height: AVATAR_SIZES.lg },
      xl: { width: AVATAR_SIZES.xl, height: AVATAR_SIZES.xl },
    },

    // Ring (border) variants
    ring: {
      true: {
        borderWidth: 2,
        borderColor: '$primary',
      },
      success: {
        borderWidth: 2,
        borderColor: '$success',
      },
      warning: {
        borderWidth: 2,
        borderColor: '$warning',
      },
      error: {
        borderWidth: 2,
        borderColor: '$error',
      },
    },

    // Pressable
    pressable: {
      true: {
        pressStyle: {
          scale: 0.95,
          opacity: 0.9,
        },
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

// Fallback text for initials
const FallbackText = styled(Text, {
  name: 'AvatarFallback',
  fontWeight: '600',
  color: '$textSecondary',

  variants: {
    size: {
      xs: { fontSize: 10 },
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 20 },
      xl: { fontSize: 28 },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

// Status indicator
const StatusIndicator = styled(YStack, {
  name: 'AvatarStatus',
  position: 'absolute',
  bottom: 0,
  right: 0,
  borderRadius: 9999,
  borderWidth: 2,
  borderColor: '$background',

  variants: {
    status: {
      online: { backgroundColor: '$success' },
      offline: { backgroundColor: '$textTertiary' },
      busy: { backgroundColor: '$error' },
      away: { backgroundColor: '$warning' },
    },
    size: {
      xs: { width: 8, height: 8 },
      sm: { width: 10, height: 10 },
      md: { width: 12, height: 12 },
      lg: { width: 14, height: 14 },
      xl: { width: 18, height: 18 },
    },
  } as const,

  defaultVariants: {
    size: 'md',
    status: 'online',
  },
});

// Props types
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';
export type AvatarRing = boolean | 'success' | 'warning' | 'error';

export interface TamaguiAvatarProps {
  /** Image source URI */
  source?: string;
  /** Fallback initials (2 chars max) */
  fallback?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Ring color */
  ring?: AvatarRing;
  /** Status indicator */
  status?: AvatarStatus;
  /** Press handler */
  onPress?: () => void;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function TamaguiAvatar({
  source,
  fallback,
  size = 'md',
  ring,
  status,
  onPress,
  testID,
  accessibilityLabel,
}: TamaguiAvatarProps) {
  const isPressable = !!onPress;
  const avatarSize = AVATAR_SIZES[size];

  // Get initials from fallback (max 2 chars)
  const initials = fallback?.substring(0, 2).toUpperCase() || '?';

  // Convert ring to variant value
  const ringValue = ring === true ? 'true' : ring || undefined;

  return (
    <YStack position="relative">
      <AvatarContainer
        size={size}
        ring={ringValue as any}
        pressable={isPressable}
        onPress={onPress}
        accessibilityRole={isPressable ? 'button' : 'image'}
        accessibilityLabel={accessibilityLabel || `Avatar${fallback ? ` of ${fallback}` : ''}`}
        testID={testID}
      >
        {source ? (
          <Image
            source={{ uri: source }}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: 9999,
            }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <FallbackText size={size}>{initials}</FallbackText>
        )}
      </AvatarContainer>

      {status && (
        <StatusIndicator status={status} size={size} accessibilityLabel={`Status: ${status}`} />
      )}
    </YStack>
  );
}

// Type exports
export type { GetProps };

export default TamaguiAvatar;
