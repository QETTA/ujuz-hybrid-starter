/**
 * PeerActivityCard - 또래 활동 카드
 *
 * 2026 UJUz 디자인
 * - 활동 유형별 아이콘
 * - 아바타 스택
 * - 한국어 동사
 */

import { Image } from 'react-native';
import { XStack, YStack, Text, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import type { PeerActivity } from '@/app/types/peerSync';
import { TamaguiPressableScale, SocialProofBadge } from '@/app/design-system';

export interface PeerActivityCardProps {
  activity: PeerActivity;
  onPress?: () => void;
  compact?: boolean;
  testID?: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  place_visit: 'location',
  place_save: 'bookmark',
  group_buy: 'cart',
  shorts_watch: 'videocam',
  review_write: 'create',
};

const ACTIVITY_VERBS: Record<string, string> = {
  place_visit: '방문했어요',
  place_save: '저장했어요',
  group_buy: '참여했어요',
  shorts_watch: '시청했어요',
  review_write: '리뷰를 남겼어요',
};

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return then.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getActivityTitle(activity: PeerActivity): string {
  switch (activity.type) {
    case 'place_visit':
      return activity.place?.name || '장소를 방문했어요';
    case 'place_save':
      return activity.place?.name || '장소를 저장했어요';
    case 'group_buy':
      return activity.groupBuy?.title || '공동구매에 참여했어요';
    case 'shorts_watch':
      return activity.shorts?.title || '영상을 시청했어요';
    case 'review_write':
      return activity.place?.name || '리뷰를 남겼어요';
    default:
      return '활동';
  }
}

function getThumbnailUrl(activity: PeerActivity): string | undefined {
  return activity.place?.thumbnailUrl || activity.shorts?.thumbnailUrl || undefined;
}

export function PeerActivityCard({
  activity,
  onPress,
  compact = false,
  testID,
}: PeerActivityCardProps) {
  const theme = useTheme();
  const thumbnailUrl = getThumbnailUrl(activity);
  const title = getActivityTitle(activity);
  const verb = ACTIVITY_VERBS[activity.type] ?? '';
  const timeAgo = getTimeAgo(activity.timestamp);
  const iconName = ACTIVITY_ICONS[activity.type] ?? 'ellipsis-horizontal';

  return (
    <TamaguiPressableScale
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: compact ? 10 : 14,
        backgroundColor: compact ? 'transparent' : theme.surface.val,
        borderRadius: 14,
        gap: 12,
      }}
      onPress={onPress}
      hapticType="light"
      testID={testID}
      accessibilityLabel={activity.message}
    >
      {thumbnailUrl && !compact ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            backgroundColor: theme.surfaceElevated.val,
          }}
          resizeMode="cover"
        />
      ) : (
        <XStack
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor="$surfaceElevated"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons
            name={iconName as any}
            size={16}
            color={theme.primary.val}
          />
        </XStack>
      )}

      <YStack flex={1} gap={4}>
        <Text
          fontSize={14}
          fontWeight="600"
          color="$textPrimary"
          numberOfLines={1}
        >
          {title}
        </Text>

        <XStack alignItems="center" gap="$2">
          <SocialProofBadge
            count={activity.peerCount}
            label={`{count}명이 ${verb}`}
            size="sm"
          />
          <Text fontSize={12} color="$textTertiary">
            · {timeAgo}
          </Text>
        </XStack>

        {activity.type === 'group_buy' && (
          <XStack marginTop="$1">
            <Text fontSize={12} fontWeight="600" color="$primary">
              참여하기 →
            </Text>
          </XStack>
        )}
      </YStack>

      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary.val} />
    </TamaguiPressableScale>
  );
}

export default PeerActivityCard;
