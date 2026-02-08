/**
 * TamaguiPressableScale - Micro-interaction 컴포넌트
 *
 * 2026 Design System: 마이크로 인터랙션 래퍼
 * - Press scale animation (0.97)
 * - Haptic feedback (Light/Medium)
 * - Spring physics (Reanimated)
 */

import React from 'react';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Animations } from '@/app/constants';

const SPRING_CONFIG = Animations.springSnappy;

export interface TamaguiPressableScaleProps {
  /** Children content */
  children: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Scale amount on press (default: 0.97) */
  scale?: number;
  /** Haptic feedback type */
  hapticType?: 'light' | 'medium' | 'none';
  /** Style override */
  style?: any;
  /** Disabled state */
  disabled?: boolean;
  /** Test ID */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export function TamaguiPressableScale({
  children,
  onPress,
  scale: scaleAmount = 0.97,
  hapticType = 'light',
  style,
  disabled = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: TamaguiPressableScaleProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scaleValue.value = withSpring(scaleAmount, SPRING_CONFIG);
    })
    .onFinalize(() => {
      scaleValue.value = withSpring(1, SPRING_CONFIG);
    })
    .onEnd(() => {
      if (onPress && !disabled) {
        if (hapticType === 'medium') {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        } else if (hapticType === 'light') {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        }
        runOnJS(onPress)();
      }
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[animatedStyle, style]}
        testID={testID}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export default TamaguiPressableScale;
