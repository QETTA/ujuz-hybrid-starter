/**
 * TamaguiSkeleton - Loading Skeleton 컴포넌트
 *
 * 2026 Design System: Shimmer 로딩 애니메이션
 * - Shape variants (text, avatar, card, etc.)
 * - Animated shimmer effect
 * - Light/Dark 모드 자동 지원
 */

import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { styled, YStack, GetProps } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Styled Skeleton Base
const SkeletonBase = styled(YStack, {
  name: 'Skeleton',
  backgroundColor: '$surfaceMuted',
  overflow: 'hidden',

  variants: {
    // Shape variants
    variant: {
      text: {
        height: 16,
        borderRadius: '$1',
      },
      title: {
        height: 24,
        borderRadius: '$2',
      },
      avatar: {
        borderRadius: 9999,
      },
      card: {
        borderRadius: '$4',
      },
      button: {
        height: 44,
        borderRadius: '$3',
      },
      thumbnail: {
        borderRadius: '$2',
        aspectRatio: 1,
      },
      banner: {
        borderRadius: '$3',
        aspectRatio: 2.5,
      },
    },

    // Width variants
    width: {
      full: { width: '100%' },
      half: { width: '50%' },
      third: { width: '33%' },
      quarter: { width: '25%' },
    },
  } as const,

  defaultVariants: {
    variant: 'text',
    width: 'full',
  },
});

// Animated Shimmer Component
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// Props types
export type SkeletonVariant =
  | 'text'
  | 'title'
  | 'avatar'
  | 'card'
  | 'button'
  | 'thumbnail'
  | 'banner';
export type SkeletonWidth = 'full' | 'half' | 'third' | 'quarter';

export interface TamaguiSkeletonProps {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Width preset */
  width?: SkeletonWidth;
  /** Custom width (overrides width variant) */
  customWidth?: number | string;
  /** Custom height (overrides variant height) */
  customHeight?: number;
  /** Enable shimmer animation */
  animate?: boolean;
  /** Test ID */
  testID?: string;
}

export function TamaguiSkeleton({
  variant = 'text',
  width = 'full',
  customWidth,
  customHeight,
  animate = true,
  testID,
}: TamaguiSkeletonProps) {
  const shimmerPosition = useSharedValue(-1);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shimmerColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.06)';

  // Start shimmer animation
  useEffect(() => {
    if (animate) {
      shimmerPosition.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite repeat
        false // No reverse
      );
    }
  }, [animate, shimmerPosition]);

  // Animated shimmer style
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerPosition.value, [-1, 1], [-200, 200]);

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <SkeletonBase
      variant={variant}
      width={width as any}
      style={[
        customWidth !== undefined && { width: customWidth },
        customHeight !== undefined && { height: customHeight },
      ]}
      testID={testID}
      accessibilityLabel="Loading..."
      accessibilityRole="progressbar"
    >
      {animate && (
        <AnimatedGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, shimmerStyle, { width: 200 }]}
        />
      )}
    </SkeletonBase>
  );
}

// Skeleton Group for multiple skeletons
export interface TamaguiSkeletonGroupProps {
  /** Number of text lines */
  lines?: number;
  /** Gap between lines */
  gap?: number;
  /** Last line width */
  lastLineWidth?: SkeletonWidth;
}

export function TamaguiSkeletonGroup({
  lines = 3,
  gap = 8,
  lastLineWidth = 'half',
}: TamaguiSkeletonGroupProps) {
  return (
    <YStack gap={gap as any}>
      {Array.from({ length: lines }).map((_, index) => (
        <TamaguiSkeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : 'full'}
        />
      ))}
    </YStack>
  );
}

// Type exports
export type { GetProps };

export default TamaguiSkeleton;
