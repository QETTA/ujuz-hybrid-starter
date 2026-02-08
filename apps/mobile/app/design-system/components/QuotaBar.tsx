/**
 * QuotaBar - 사용량/한도 진행률 바
 *
 * 구독 쿼터 시각화 + 업그레이드 CTA
 *
 * Phase 10.2: 테마 토큰 + 햅틱 경고 (80%/100%)
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface QuotaBarProps {
  /** Feature label */
  label: string;
  /** Current usage */
  used: number;
  /** Maximum quota */
  total: number;
  /** Left icon emoji or text */
  icon?: string;
  /** Left icon as Ionicons name (type-safe, takes priority over icon) */
  iconName?: IoniconName;
  /** Show upgrade CTA when exhausted */
  showUpgradeCta?: boolean;
  /** Upgrade press handler */
  onUpgradePress?: () => void;
}

export function QuotaBar({
  label,
  used,
  total,
  icon,
  iconName,
  showUpgradeCta = true,
  onUpgradePress,
}: QuotaBarProps) {
  const theme = useTheme();
  const ratio = Math.min(used / total, 1);
  const isExhausted = used >= total;
  const isNearLimit = ratio >= 0.8;
  const prevRatio = useRef(ratio);

  // Haptic warnings at 80% and 100% thresholds
  useEffect(() => {
    const prev = prevRatio.current;
    if (prev < 1 && ratio >= 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (prev < 0.8 && ratio >= 0.8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevRatio.current = ratio;
  }, [ratio]);

  const barColor = isExhausted
    ? theme.error.val
    : isNearLimit
      ? theme.warning.val
      : theme.primary.val;

  const animatedWidth = useAnimatedStyle(() => ({
    width: withSpring(`${ratio * 100}%` as any, {
      damping: 15,
      stiffness: 120,
    }),
  }));

  return (
    <YStack gap="$1">
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$1">
          {iconName ? (
            <Ionicons name={iconName} size={16} color={theme.textSecondary.val} />
          ) : icon ? (
            <Text fontSize={14}>{icon}</Text>
          ) : null}
          <Text fontSize={13} fontWeight="500" color="$textSecondary">
            {label}
          </Text>
        </XStack>
        <Text
          fontSize={13}
          fontWeight="600"
          color={isExhausted ? '$error' : '$textPrimary'}
        >
          {used}/{total}
        </Text>
      </XStack>
      <View style={[styles.barBg, { backgroundColor: theme.borderColor.val + '20' }]}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: barColor },
            animatedWidth,
          ]}
        />
      </View>
      {isExhausted && showUpgradeCta && (
        <Text
          fontSize={12}
          color="$primary"
          fontWeight="600"
          onPress={onUpgradePress}
          pressStyle={{ opacity: 0.7 }}
        >
          업그레이드하기 →
        </Text>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default QuotaBar;
