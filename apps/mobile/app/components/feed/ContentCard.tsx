import { memo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';
import { formatNumber, formatRelativeTime } from '@/app/utils';
import type { NormalizedContent } from '@/app/types/places';

interface ContentCardProps {
  content: NormalizedContent;
  onPress?: () => void;
}

function getContentIcon(source: NormalizedContent['source']) {
  switch (source) {
    case 'YOUTUBE':
      return { name: 'logo-youtube' as const, color: Colors.iosSystemRed };
    case 'NAVER_BLOG':
      return { name: 'document-text' as const, color: Colors.primary };
    case 'NAVER_CLIP':
      return { name: 'play-circle' as const, color: Colors.primary };
    default:
      return { name: 'globe' as const, color: Colors.primary };
  }
}

function ContentCard({ content, onPress }: ContentCardProps) {
  const icon = getContentIcon(content.source);

  return (
    <TamaguiPressableScale
      style={styles.card}
      onPress={onPress}
      hapticType="light"
      accessibilityLabel={`${content.title}, by ${content.author}`}
      accessibilityHint={COPY.A11Y_VIEW_CONTENT}
    >
      {/* Thumbnail */}
      {content.thumbnailUrl ? (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: content.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {content.duration && (
            <View style={styles.durationBadge}>
              <TamaguiText
                preset="caption"
                textColor="inverse"
                weight="semibold"
                style={styles.durationText}
              >
                {Math.floor(content.duration / 60)}:{String(content.duration % 60).padStart(2, '0')}
              </TamaguiText>
            </View>
          )}
          <View style={styles.sourceBadge}>
            <Ionicons name={icon.name} size={16} color={icon.color} />
          </View>
        </View>
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Ionicons name={icon.name} size={48} color={icon.color} />
        </View>
      )}

      {/* Content Info */}
      <View style={styles.content}>
        <TamaguiText
          preset="body"
          textColor="primary"
          weight="semibold"
          style={styles.title}
          numberOfLines={2}
        >
          {content.title}
        </TamaguiText>

        <View style={styles.authorRow}>
          {content.authorThumbnail && (
            <Image source={{ uri: content.authorThumbnail }} style={styles.authorAvatar} />
          )}
          <TamaguiText preset="body" textColor="secondary" style={styles.author} numberOfLines={1}>
            {content.author}
          </TamaguiText>
        </View>

        {content.description && (
          <TamaguiText
            preset="body"
            textColor="secondary"
            style={styles.description}
            numberOfLines={2}
          >
            {content.description}
          </TamaguiText>
        )}

        <View style={styles.footer}>
          {content.viewCount !== undefined && (
            <View style={styles.stat}>
              <Ionicons name="eye" size={14} color={Colors.textSecondary} />
              <TamaguiText preset="caption" textColor="secondary" style={styles.statText}>
                {formatNumber(content.viewCount)}
              </TamaguiText>
            </View>
          )}

          {content.likeCount !== undefined && content.likeCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="heart" size={14} color={Colors.textSecondary} />
              <TamaguiText preset="caption" textColor="secondary" style={styles.statText}>
                {formatNumber(content.likeCount)}
              </TamaguiText>
            </View>
          )}

          {content.commentCount !== undefined && content.commentCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="chatbubble" size={14} color={Colors.textSecondary} />
              <TamaguiText preset="caption" textColor="secondary" style={styles.statText}>
                {formatNumber(content.commentCount)}
              </TamaguiText>
            </View>
          )}

          <TamaguiText preset="caption" textColor="tertiary" style={styles.date}>
            {formatRelativeTime(content.publishedAt)}
          </TamaguiText>
        </View>

        {content.relatedPlaceName && (
          <View style={styles.placeBadge}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <TamaguiText
              preset="caption"
              weight="medium"
              style={styles.placeText}
              numberOfLines={1}
            >
              {content.relatedPlaceName}
            </TamaguiText>
          </View>
        )}
      </View>
    </TamaguiPressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  thumbnailPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Layout.spacing.sm,
    right: Layout.spacing.sm,
    backgroundColor: Colors.overlayDark80,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  durationText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
    fontWeight: Layout.fontWeight.semibold,
  },
  sourceBadge: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
    backgroundColor: Colors.background,
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  content: {
    padding: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize.md,
    fontWeight: Layout.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
    lineHeight: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.full,
  },
  author: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Layout.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
  placeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Layout.spacing.sm,
    gap: Layout.spacing.xs,
  },
  placeText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
    fontWeight: Layout.fontWeight.medium,
  },
});

// Memoize to prevent unnecessary re-renders
export default memo(ContentCard, (prevProps, nextProps) => {
  return prevProps.content.id === nextProps.content.id;
});
