/**
 * PeerActivityCard - 또래 활동 카드
 *
 * Dark-first 2026 디자인
 * - 텍스트 중심, 아이콘 최소화
 * - borderless card on dark surface
 */

import { StyleSheet, View, Image } from 'react-native';
import type { PeerActivity } from '@/app/types/peerSync';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

// ============================================
// Types
// ============================================

export interface PeerActivityCardProps {
  activity: PeerActivity;
  onPress?: () => void;
  compact?: boolean;
  testID?: string;
}

// ============================================
// Helper Functions
// ============================================

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActivityTitle(activity: PeerActivity): string {
  switch (activity.type) {
    case 'place_visit':
      return activity.place?.name || 'visited a place';
    case 'place_save':
      return activity.place?.name || 'saved a place';
    case 'group_buy':
      return activity.groupBuy?.title || 'joined a deal';
    case 'shorts_watch':
      return activity.shorts?.title || 'watched a short';
    case 'review_write':
      return activity.place?.name || 'wrote a review';
    default:
      return 'activity';
  }
}

function getActivityVerb(type: PeerActivity['type']): string {
  switch (type) {
    case 'place_visit':
      return 'visited';
    case 'place_save':
      return 'saved';
    case 'group_buy':
      return 'joined';
    case 'shorts_watch':
      return 'watched';
    case 'review_write':
      return 'reviewed';
    default:
      return '';
  }
}

function getThumbnailUrl(activity: PeerActivity): string | undefined {
  return activity.place?.thumbnailUrl || activity.shorts?.thumbnailUrl || undefined;
}

// ============================================
// Component
// ============================================

export function PeerActivityCard({
  activity,
  onPress,
  compact = false,
  testID,
}: PeerActivityCardProps) {
  const thumbnailUrl = getThumbnailUrl(activity);
  const title = getActivityTitle(activity);
  const verb = getActivityVerb(activity.type);
  const timeAgo = getTimeAgo(activity.timestamp);

  return (
    <TamaguiPressableScale
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      hapticType="light"
      testID={testID}
      accessibilityLabel={activity.message}
    >
      {thumbnailUrl && !compact && (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
      )}

      <View style={styles.content}>
        <TamaguiText
          preset="body"
          textColor="primary"
          weight="semibold"
          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </TamaguiText>

        <View style={styles.statsRow}>
          <TamaguiText preset="caption" textColor="secondary" style={styles.statText}>
            {activity.peerCount} {verb}
          </TamaguiText>
          <TamaguiText preset="caption" textColor="secondary" style={styles.statText}>
            ·
          </TamaguiText>
          <TamaguiText preset="caption" textColor="secondary" style={styles.statText}>
            {timeAgo}
          </TamaguiText>
        </View>
      </View>

      <TamaguiText preset="body" textColor="tertiary" style={styles.arrow}>
        ›
      </TamaguiText>
    </TamaguiPressableScale>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    gap: 12,
  },
  cardCompact: {
    padding: 10,
    backgroundColor: 'transparent',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.darkSurfaceElevated,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
  },
  arrow: {
    fontSize: 20,
    color: Colors.darkTextTertiary,
    fontWeight: '300',
  },
});

export default PeerActivityCard;
