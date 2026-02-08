/**
 * PeerStatusBar - 또래 실시간 상태 바
 *
 * 2026 KidsMap 킬러 기능
 * 화면 상단에 표시되어 또래 부모들의 실시간 활동을 보여줌
 */

import { XStack, YStack, styled } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { TamaguiGlassCard, TamaguiText } from '@/app/design-system/components';
import { Colors } from '@/app/constants';
import type { PeerLiveStatus } from '@/app/types/peerSync';

// ============================================
// Types
// ============================================

export interface PeerStatusBarProps {
  /** 또래 실시간 현황 */
  status: PeerLiveStatus;
  /** 내 아이 나이 (개월) */
  childAgeMonths: number;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 테스트 ID */
  testID?: string;
}

// ============================================
// Styled Components
// ============================================

const StatusContainer = styled(XStack, {
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const StatusItem = styled(XStack, {
  alignItems: 'center',
  gap: '$1',
});

const PulsingDot = styled(Animated.View, {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '$success',
});

// Removed styled Text components - using TamaguiText instead

// ============================================
// Component
// ============================================

export function PeerStatusBar({ status, childAgeMonths, onPress, testID }: PeerStatusBarProps) {
  // Pulsing animation for live indicator
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
      <StatusContainer>
        {/* Live Status */}
        <StatusItem>
          <PulsingDot style={pulseStyle} />
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
        </StatusItem>

        {/* Today Stats */}
        <StatusItem>
          <Ionicons name="today-outline" size={16} color={Colors.iosTertiaryLabel} />
          <YStack alignItems="center">
            <TamaguiText preset="body" textColor="primary" weight="semibold">
              {status.activeToday.toLocaleString()}
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary">
              오늘 활동
            </TamaguiText>
          </YStack>
        </StatusItem>

        {/* Nearby */}
        <StatusItem>
          <Ionicons name="location-outline" size={16} color={Colors.iosTertiaryLabel} />
          <YStack alignItems="center">
            <TamaguiText preset="body" textColor="primary" weight="semibold">
              {status.nearbyActive.toLocaleString()}
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary">
              주변 또래
            </TamaguiText>
          </YStack>
        </StatusItem>

        {/* Arrow indicator */}
        <Ionicons name="chevron-forward" size={20} color={Colors.iosQuaternaryLabel} />
      </StatusContainer>
    </TamaguiGlassCard>
  );
}

export default PeerStatusBar;
