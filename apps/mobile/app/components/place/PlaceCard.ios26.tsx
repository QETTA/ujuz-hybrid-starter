/**
 * PlaceCard Component - iOS 26 Design with 2026 UX Enhancements
 *
 * Design Philosophy:
 * - Typography-first (no emoji/icon overuse)
 * - Glassmorphism backgrounds
 * - Generous whitespace
 * - Muted colors
 * - Subtle depth
 *
 * 2026 UX Additions:
 * - Trust badges (verified, popular)
 * - Social proof (saves, recent visits)
 * - Video content indicators
 * - Visual ratings with stars
 */

import { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { formatDistance } from '@/app/utils/distance';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import {
  getPlaceCardLabel,
  getFavoriteButtonLabel,
  getFavoriteButtonHint,
} from '@/app/utils/accessibility';
import { OptimizedImage } from '@/app/components/shared';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import Badge from '@/app/design-system/components/Badge/Badge';
import Rating from '@/app/design-system/components/Rating/Rating';
import { useGroupBuyStore } from '@/app/stores/groupBuyStore';
import type { PlaceWithDistance } from '@/app/types/places';
import type { PlaceInsights } from '@/app/types/dataBlock';

interface PlaceCardProps {
  place: PlaceWithDistance;
  insights?: PlaceInsights;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

function PlaceCard({
  place,
  insights,
  onPress,
  onFavoritePress,
  isFavorite = false,
}: PlaceCardProps) {
  const { groupBuys } = useGroupBuyStore();

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleFavoritePress = useCallback(() => {
    onFavoritePress?.();
  }, [onFavoritePress]);

  // Check for active group buys - show badge for ticket-type group buys on some places (for demo)
  // Uses deterministic hash to show badge on ~30% of places when there are active group buys
  const { hasGroupBuy, maxDiscount } = useMemo(() => {
    const activeTicketGroupBuys = groupBuys.filter(
      (gb) => gb.item_type === 'ticket' && gb.status === 'active'
    );
    if (activeTicketGroupBuys.length === 0) {
      return { hasGroupBuy: false, maxDiscount: 0 };
    }
    // Use place id hash for deterministic display
    const hash = place.id.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);
    const showBadge = Math.abs(hash) % 100 < 30;
    const discount = showBadge
      ? Math.max(...activeTicketGroupBuys.map((gb) => gb.max_discount_rate || 20))
      : 0;
    return { hasGroupBuy: showBadge, maxDiscount: discount };
  }, [place.id, groupBuys]);

  // Derived trust signals from real data only
  const { isVerified, isPopular } = useMemo(() => {
    if (!insights) return { isVerified: false, isPopular: false };
    const blocks = Object.values(insights).filter(
      (b) => b != null
    ) as PlaceInsights[keyof PlaceInsights][];
    const max = blocks.length > 0 ? Math.max(...blocks.map((b) => b?.confidence ?? 0)) : 0;
    return {
      isVerified: max >= 0.8,
      isPopular: typeof place.reviewCount === 'number' && place.reviewCount >= 100,
    };
  }, [insights, place.reviewCount]);

  const rating = typeof place.rating === 'number' ? place.rating : undefined;
  const reviewCount = typeof place.reviewCount === 'number' ? place.reviewCount : undefined;

  // Amenities as text (iOS 26 style - no icons)
  const amenitiesText = useMemo(() => {
    const list: string[] = [];
    if (place.amenities?.parking) list.push(COPY.AMENITY_PARKING);
    if (place.amenities?.nursingRoom) list.push(COPY.AMENITY_NURSING_ROOM);
    if (place.amenities?.diaperChangingStation) list.push(COPY.AMENITY_DIAPER_STATION);
    return list.join(' · ');
  }, [
    place.amenities?.parking,
    place.amenities?.nursingRoom,
    place.amenities?.diaperChangingStation,
  ]);

  const insightItems = useMemo(() => {
    if (!insights) return [];
    return [
      { key: 'wait', label: '대기', block: insights.waitTime },
      { key: 'deal', label: '딜', block: insights.dealCount },
      { key: 'crowd', label: '혼잡', block: insights.crowdLevel },
    ].filter((item) => item.block);
  }, [insights]);

  return (
    <TamaguiPressableScale
      style={styles.card}
      onPress={handlePress}
      hapticType="light"
      accessibilityLabel={getPlaceCardLabel({
        name: place.name,
        category: place.category,
        rating,
        distance: place.distance,
      })}
      accessibilityHint={COPY.A11Y_VIEW_PLACE}
    >
      {/* Image with overlays */}
      <View
        style={styles.imageContainer}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        {place.thumbnailUrl ? (
          <OptimizedImage
            uri={place.thumbnailUrl}
            style={styles.image}
            contentFit="cover"
            priority="normal"
            alt={`${place.name} image`}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        {/* Trust badges - top left */}
        <View style={styles.topBadges}>
          {isVerified && <Badge variant="verified" size="sm" label={COPY.BADGE_VERIFIED} />}
          {isPopular && <Badge variant="popular" size="sm" label={COPY.BADGE_POPULAR} />}
          {hasGroupBuy && (
            <View style={styles.groupBuyBadge}>
              <TamaguiText preset="caption" textColor="inverse" weight="bold">
                {maxDiscount > 0 ? `${maxDiscount}% 할인` : '공동구매'}
              </TamaguiText>
            </View>
          )}
        </View>

        {/* Favorite button - top right */}
        {onFavoritePress && (
          <TamaguiPressableScale
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hapticType="medium"
            accessibilityLabel={getFavoriteButtonLabel({ placeName: place.name, isFavorite })}
            accessibilityHint={getFavoriteButtonHint(isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.iosSystemRed : Colors.white}
              style={styles.favoriteIcon}
            />
          </TamaguiPressableScale>
        )}
      </View>

      {/* Content - Typography-first with enhanced UX */}
      <View style={styles.content}>
        {/* Place name */}
        <TamaguiText
          preset="body"
          textColor="primary"
          weight="semibold"
          style={styles.name}
          numberOfLines={1}
        >
          {place.name}
        </TamaguiText>

        {/* Visual rating with stars + review count (real data only) */}
        {rating !== undefined && (
          <View style={styles.ratingRow}>
            <Rating rating={rating} reviewCount={reviewCount} size="sm" showReviewCount={true} />
          </View>
        )}

        {/* Address - minimal */}
        {place.address && (
          <TamaguiText
            preset="caption"
            textColor="tertiary"
            style={styles.address}
            numberOfLines={1}
          >
            {place.address}
          </TamaguiText>
        )}

        {/* Bottom row: Distance + Free + Social Proof */}
        <View style={styles.bottomRow}>
          {/* Distance badge */}
          {place.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <TamaguiText preset="caption" textColor="secondary" weight="medium">
                {formatDistance(place.distance)}
              </TamaguiText>
            </View>
          )}

          {/* Free admission badge */}
          {place.admissionFee?.isFree && (
            <View style={styles.freeBadge}>
              <TamaguiText preset="caption" weight="semibold" style={styles.freeText}>
                {COPY.AMENITY_FREE}
              </TamaguiText>
            </View>
          )}

          {/* Social proof removed: show only real data */}
        </View>

        {/* Amenities (if any) */}
        {amenitiesText.length > 0 && (
          <View style={styles.amenitiesRow}>
            <TamaguiText preset="caption" textColor="tertiary" numberOfLines={1}>
              {amenitiesText}
            </TamaguiText>
          </View>
        )}

        {/* Insights (Data Blocks) */}
        {insightItems.length > 0 && (
          <View style={styles.insightsRow}>
            {insightItems.map((item) => {
              if (!item.block) return null;
              return (
                <View key={item.key} style={styles.insightItem}>
                  <TamaguiText preset="caption" textColor="primary" weight="bold">
                    {item.block.value}
                  </TamaguiText>
                  <TamaguiText preset="caption" textColor="tertiary" weight="medium">
                    {item.label}
                  </TamaguiText>
                  <ConfidenceBadge confidence={item.block.confidence} size="sm" />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TamaguiPressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: Colors.darkSurfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.darkSurfaceElevated,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    opacity: 0.9,
  },
  topBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'column',
    gap: 6,
  },
  groupBuyBadge: {
    backgroundColor: Colors.iosSystemOrange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  groupBuyBadgeText: {
    color: Colors.darkBg,
    fontSize: 11,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blackAlpha40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.whiteAlpha10,
  },
  favoriteIcon: {
    textShadowColor: Colors.blackAlpha30,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.darkTextPrimary,
    marginBottom: 8,
  },
  ratingRow: {
    marginBottom: 6,
  },
  address: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  distanceBadge: {
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
  },
  freeBadge: {
    backgroundColor: Colors.primaryAlpha10,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freeText: {
    color: Colors.primary,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialProofText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkTextTertiary,
  },
  amenitiesRow: {
    marginTop: 4,
  },
  amenities: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
  },
  insightsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  insightItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.darkTextTertiary,
  },
});

export default memo(PlaceCard, (prevProps, nextProps) => {
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.place.distance === nextProps.place.distance
  );
});
