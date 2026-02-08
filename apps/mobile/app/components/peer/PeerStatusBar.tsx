/**
 * PeerStatusBar - 또래 실시간 상태 바
 *
 * 2026 UJUz 테마 토큰 기반
 */

import { XStack, YStack, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { TamaguiGlassCard, TamaguiText } from '@/app/design-system/components';
import type { PeerLiveStatus } from '@/app/types/peerSync';

export interface PeerStatusBarProps {
  status: PeerLiveStatus;
  childAgeMonths: number;
  onPress?: () => void;
  testID?: string;
}

export function PeerStatusBar({ status, childAgeMonths, onPress, testID }: PeerStatusBarProps) {
  const theme = useTheme();

  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })),
        -1,
        true
      ),
      transform: [
        {
          scale: withRepeat(
            withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
            -1,
            true
          ),
        },
      ],
    };
  });

  const ageRangeText = `${Math.max(0, childAgeMonths - 3)}-${childAgeMonths + 3}개월`;

  return (
    <TamaguiGlassCard
      intensity="light"
      padding="none"
      onPress={onPress}
      testID={testID}
      accessibilityLabel={`또래 현황: 현재 ${status.activeNow}명 활동 중`}
    >
      <XStack
        paddingHorizontal="$3"
        paddingVertical="$2"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="center" gap="$1">
          <Animated.View
            style={[
              {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.success.val,
              },
              pulseStyle,
            ]}
          />
          <YStack>
            <XStack alignItems="baseline" gap="$1">
              <TamaguiText preset="body" textColor="primary" weight="semibold">
                {status.activeNow.toLocaleString()}
              </TamaguiText>
              <TamaguiText preset="caption" textColor="secondary">
                명 활동 중
              </TamaguiText>
            </XStack>
            <TamaguiText preset="caption" textColor="secondary">
              {ageRangeText} 또래
            </TamaguiText>
          </YStack>
        </XStack>

        <XStack alignItems="center" gap="$1">
          <Ionicons name="today-outline" size={16} color={theme.textTertiary.val} />
          <YStack alignItems="center">
            <TamaguiText preset="body" textColor="primary" weight="semibold">
              {status.activeToday.toLocaleString()}
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary">
              오늘 활동
            </TamaguiText>
          </YStack>
        </XStack>

        <XStack alignItems="center" gap="$1">
          <Ionicons name="location-outline" size={16} color={theme.textTertiary.val} />
          <YStack alignItems="center">
            <TamaguiText preset="body" textColor="primary" weight="semibold">
              {status.nearbyActive.toLocaleString()}
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary">
              주변 또래
            </TamaguiText>
          </YStack>
        </XStack>

        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary.val} />
      </XStack>
    </TamaguiGlassCard>
  );
}

export default PeerStatusBar;
