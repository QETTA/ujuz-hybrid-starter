/**
 * TamaguiPlaceCard - Tamagui 기반 PlaceCard 컴포넌트
 *
 * iOS 26 Design with 2026 UX Enhancements
 * - Typography-first design
 * - Trust badges (verified, popular)
 * - Visual ratings with stars
 * - Social proof indicators
 *
 * 기존 PlaceCard.ios26과 동일한 Props 인터페이스 유지
 */

import { memo, useCallback, useMemo } from 'react';
import { styled, YStack, XStack, Text, GetProps, useTheme } from 'tamagui';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { formatDistance } from '@/app/utils/distance';
import {
  getPlaceCardLabel,
  getFavoriteButtonLabel,
  getFavoriteButtonHint,
} from '@/app/utils/accessibility';
import { OptimizedImage } from '@/app/components/shared';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import TamaguiBadge from '@/app/design-system/components/TamaguiBadge';
import { TamaguiRatingStars, TamaguiPressableScale } from '@/app/design-system';
import type { PlaceWithDistance } from '@/app/types/places';
import type { PlaceInsights } from '@/app/types/dataBlock';

// Styled card container
const CardContainer = styled(YStack, {
  name: 'PlaceCard',
  backgroundColor: '$surface',
  borderRadius: 16,
  marginHorizontal: 16,
  marginVertical: 8,
  overflow: 'hidden',
  borderWidth: 0.5,
  borderColor: '$borderColor',
  pressStyle: {
    opacity: 0.9,
    scale: 0.99,
  },
});

// Styled content container
const Content = styled(YStack, {
  name: 'PlaceCardContent',
  padding: 16,
});

// Styled place name
const PlaceName = styled(Text, {
  name: 'PlaceCardName',
  fontSize: 18,
  fontWeight: '600',
  letterSpacing: -0.3,
  color: '$textPrimary',
  marginBottom: 8,
});

// Styled address text
const AddressText = styled(Text, {
  name: 'PlaceCardAddress',
  fontSize: 14,
  fontWeight: '400',
  color: '$textSecondary',
  marginBottom: 12,
});

// Styled bottom row
const BottomRow = styled(XStack, {
  name: 'PlaceCardBottomRow',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
});

// Styled distance badge
const DistanceBadge = styled(XStack, {
  name: 'DistanceBadge',
  backgroundColor: '$surfaceElevated',
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 4,
});

// Styled free badge
const FreeBadge = styled(XStack, {
  name: 'FreeBadge',
  backgroundColor: Colors.successAlpha10 as any,
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 4,
});

// Styled badge text
const BadgeText = styled(Text, {
  name: 'BadgeText',
  fontSize: 12,
  fontWeight: '500',
  color: '$textSecondary',
});

const FreeBadgeText = styled(Text, {
  name: 'FreeBadgeText',
  fontSize: 12,
  fontWeight: '600',
  color: Colors.iosSystemGreen as any,
});

// Amenities text
const AmenitiesText = styled(Text, {
  name: 'AmenitiesText',
  fontSize: 12,
  fontWeight: '400',
  color: '$textTertiary',
  marginTop: 4,
});

// Props types
interface TamaguiPlaceCardProps {
  place: PlaceWithDistance;
  insights?: PlaceInsights;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  testID?: string;
}

function TamaguiPlaceCard({
  place,
  insights,
  onPress,
  onFavoritePress,
  isFavorite = false,
  testID,
}: TamaguiPlaceCardProps) {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleFavoritePress = useCallback(() => {
    onFavoritePress?.();
  }, [onFavoritePress]);

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

  // Amenities text
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
    <CardContainer
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={getPlaceCardLabel({
        name: place.name,
        category: place.category,
        rating,
        distance: place.distance,
      })}
      accessibilityHint={COPY.A11Y_VIEW_PLACE}
      testID={testID}
    >
      {/* Image with overlays */}
      <View
        style={{
          width: '100%',
          height: 200,
          position: 'relative',
          backgroundColor: theme.surface.val,
        }}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        {place.thumbnailUrl ? (
          <OptimizedImage
            uri={place.thumbnailUrl}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            priority="normal"
            alt={`${place.name} image`}
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: theme.surface.val }} />
        )}

        {/* Trust badges - top left */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {isVerified && <TamaguiBadge variant="verified" size="sm" label={COPY.BADGE_VERIFIED} />}
          {isPopular && <TamaguiBadge variant="popular" size="sm" label={COPY.BADGE_POPULAR} />}
        </View>

        {/* Favorite button - top right */}
        {onFavoritePress && (
          <TamaguiPressableScale
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.overlayLight,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 0.5,
              borderColor: Colors.overlayLight,
            }}
            onPress={handleFavoritePress}
            hapticType="medium"
            accessibilityLabel={getFavoriteButtonLabel({ placeName: place.name, isFavorite })}
            accessibilityHint={getFavoriteButtonHint(isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.iosSystemRed : Colors.white}
              style={{
                textShadowColor: Colors.overlay,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            />
          </TamaguiPressableScale>
        )}
      </View>

      {/* Content */}
      <Content>
        {/* Place name */}
        <PlaceName numberOfLines={1}>{place.name}</PlaceName>

        {/* Rating row */}
        {rating !== undefined && (
          <XStack marginBottom={6}>
            <TamaguiRatingStars
              rating={rating}
              reviewCount={reviewCount}
              size={14}
              showNumber={true}
            />
          </XStack>
        )}

        {/* Address */}
        {place.address && <AddressText numberOfLines={1}>{place.address}</AddressText>}

        {/* Bottom row: Distance + Free + Social Proof */}
        <BottomRow>
          {place.distance !== undefined && (
            <DistanceBadge>
              <BadgeText>{formatDistance(place.distance)}</BadgeText>
            </DistanceBadge>
          )}

          {place.admissionFee?.isFree && (
            <FreeBadge>
              <FreeBadgeText>{COPY.AMENITY_FREE}</FreeBadgeText>
            </FreeBadge>
          )}

          {/* Social proof removed: show only real data */}
        </BottomRow>

        {/* Amenities */}
        {amenitiesText.length > 0 && (
          <AmenitiesText numberOfLines={1}>{amenitiesText}</AmenitiesText>
        )}

        {/* Insights */}
        {insightItems.length > 0 && (
          <XStack marginTop={12} gap={10}>
            {insightItems.map((item) => {
              if (!item.block) return null;
              return (
                <YStack
                  key={item.key}
                  paddingVertical={8}
                  paddingHorizontal={10}
                  borderRadius={10}
                  backgroundColor="$surfaceElevated"
                  alignItems="center"
                  gap={4}
                >
                  <Text fontSize={13} fontWeight="700" color="$textPrimary">
                    {item.block.value}
                  </Text>
                  <Text fontSize={11} fontWeight="500" color="$textTertiary">
                    {item.label}
                  </Text>
                  <ConfidenceBadge confidence={item.block.confidence} size="sm" />
                </YStack>
              );
            })}
          </XStack>
        )}
      </Content>
    </CardContainer>
  );
}

// Memoized export with custom equality check
export default memo(TamaguiPlaceCard, (prevProps, nextProps) => {
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.place.distance === nextProps.place.distance
  );
});

// Re-export types
export type { GetProps };
