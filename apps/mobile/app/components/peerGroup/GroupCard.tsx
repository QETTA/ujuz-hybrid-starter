/**
 * GroupCard - 모임 카드 컴포넌트
 *
 * 2026 UJUz 테마 토큰 기반
 */

import React from 'react';
import { Image } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { TamaguiPressableScale, SocialProofBadge } from '@/app/design-system';
import type { PeerGroup } from '@/app/types/peerGroup';

interface GroupCardProps {
  group: PeerGroup;
  onPress?: () => void;
  showMemberCount?: boolean;
}

export const GroupCard = React.memo(function GroupCard({
  group,
  onPress,
  showMemberCount = true,
}: GroupCardProps) {
  const theme = useTheme();
  const minAge = Math.floor(group.min_age_months / 12);
  const maxAge = Math.floor(group.max_age_months / 12);
  const ageLabel = `${minAge}~${maxAge}세`;

  return (
    <TamaguiPressableScale
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.surface.val,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 6,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      }}
      onPress={onPress}
      hapticType="light"
      accessibilityLabel={group.name}
      accessibilityHint="모임 상세 화면으로 이동합니다"
    >
      {group.image_url ? (
        <Image
          source={{ uri: group.image_url }}
          style={{ width: 56, height: 56, borderRadius: 12, marginRight: 12 }}
        />
      ) : (
        <XStack
          width={56}
          height={56}
          borderRadius={12}
          marginRight={12}
          backgroundColor="$surfaceElevated"
          justifyContent="center"
          alignItems="center"
        >
          <Ionicons name="people" size={24} color={theme.textTertiary.val} />
        </XStack>
      )}

      <YStack flex={1}>
        <Text
          fontSize={16}
          fontWeight="600"
          color="$textPrimary"
          marginBottom={4}
          numberOfLines={1}
        >
          {group.name}
        </Text>

        <XStack alignItems="center" gap="$2" marginBottom={4}>
          <XStack
            backgroundColor={`${Colors.primary}20` as any}
            paddingHorizontal={8}
            paddingVertical={2}
            borderRadius={4}
          >
            <Text fontSize={12} fontWeight="500" color="$primary">
              {ageLabel}
            </Text>
          </XStack>

          {group.region && (
            <Text fontSize={13} color="$textSecondary" numberOfLines={1}>
              {group.region}
            </Text>
          )}
        </XStack>

        {showMemberCount && group.member_count !== undefined && (
          <SocialProofBadge
            count={group.member_count}
            label="{count}명 참여 중"
            size="sm"
          />
        )}
      </YStack>

      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary.val} />
    </TamaguiPressableScale>
  );
});
