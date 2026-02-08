/**
 * TOAlertBadge - 빈자리 알림 라이브 인디케이터
 *
 * 펄스 도트 애니메이션 + TO 상태 텍스트
 *
 * Phase 10.2: withSpring 물리 펄스 + 테마 토큰 + 햅틱
 */

import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { XStack, Text, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface TOAlertBadgeProps {
  /** Whether a TO (vacancy) is available */
  hasVacancy: boolean;
  /** Vacancy count */
  vacancyCount?: number;
  /** Size */
  size?: 'sm' | 'md';
  /** Custom label */
  label?: string;
}

export function TOAlertBadge({
  hasVacancy,
  vacancyCount,
  size = 'md',
  label,
}: TOAlertBadgeProps) {
  const theme = useTheme();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const prevVacancy = useRef(hasVacancy);

  // Haptic on vacancy detection
  useEffect(() => {
    if (hasVacancy && !prevVacancy.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevVacancy.current = hasVacancy;
  }, [hasVacancy]);

  useEffect(() => {
    if (hasVacancy) {
      // Spring-based pulse: natural organic feel
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.8, { damping: 8, stiffness: 120 }),
          withSpring(1, { damping: 12, stiffness: 150 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withSpring(1, { damping: 15 });
      pulseOpacity.value = withSpring(0, { damping: 15 });
    }
  }, [hasVacancy]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const dotSize = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? 11 : 13;

  const displayLabel =
    label ||
    (hasVacancy
      ? vacancyCount
        ? `TO ${vacancyCount}자리`
        : 'TO 있음'
      : 'TO 없음');

  const dotColor = hasVacancy ? theme.success.val : theme.textTertiary.val;

  return (
    <XStack alignItems="center" gap="$1">
      <View style={{ width: dotSize * 2, height: dotSize * 2, justifyContent: 'center', alignItems: 'center' }}>
        {hasVacancy && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotColor,
              },
              pulseStyle,
            ]}
          />
        )}
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          }}
        />
      </View>
      <Text fontSize={fontSize} fontWeight="600" color={hasVacancy ? '$success' : '$textTertiary'}>
        {displayLabel}
      </Text>
    </XStack>
  );
}

export default TOAlertBadge;
