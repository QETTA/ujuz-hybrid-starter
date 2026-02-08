/**
 * Kakao Map Style Recommendation Component
 *
 * 카카오맵 UX 패턴 적용:
 * - 지도 위 부유하는 하단 카드 리스트
 * - 가로 스크롤 추천
 * - 거리 중심 정렬
 * - iOS 26 디자인 적용
 */

import { useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Layout } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { PlaceWithDistance } from '@/app/types/places';

// Generate stable rating based on place ID (deterministic)
function generateStableRating(placeId: string): { rating: number; reviewCount: number } {
  // Use a simple hash of the place ID to generate stable values
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) {
    hash = (hash << 5) - hash + placeId.charCodeAt(i);
    hash = hash & hash;
  }
  const normalizedHash = Math.abs(hash) / 2147483647; // Normalize to 0-1
  const rating = 4.0 + normalizedHash * 1.0; // 4.0 to 5.0
  const reviewCount = Math.floor(50 + normalizedHash * 450); // 50 to 500
  return { rating, reviewCount };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen
const CARD_SPACING = 12;

export interface KakaoStyleRecommendationProps {
  title?: string;
  places: PlaceWithDistance[];
  onPlacePress: (place: PlaceWithDistance) => void;
  onSeeAllPress?: () => void;
}

export default function KakaoStyleRecommendation({
  title = COPY.ALL_NEARBY,
  places,
  onPlacePress,
  onSeeAllPress,
}: KakaoStyleRecommendationProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  if (places.length === 0) return null;

  const handleCardPress = (place: PlaceWithDistance) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlacePress(place);
  };

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSeeAllPress?.();
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={COPY.A11Y_NEARBY_SECTION(title)}
      accessibilityHint={COPY.A11Y_BROWSE_PLACES}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {onSeeAllPress && (
          <TouchableOpacity
            onPress={handleSeeAll}
            hitSlop={Layout.hitSlop}
            accessible={true}
            accessibilityLabel={`${COPY.SEE_ALL} ${title}`}
            accessibilityRole="button"
            accessibilityHint={COPY.A11Y_ACTIVATE_HINT}
          >
            <Text style={styles.seeAll}>{COPY.SEE_ALL}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Scroll Cards */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
        accessibilityRole="list"
        accessibilityLabel={COPY.MAP_PLACES_NEARBY(places.length)}
      >
        {places.map((place, index) => (
          <RecommendationCard
            key={place.id}
            place={place}
            onPress={() => handleCardPress(place)}
            isFirst={index === 0}
            isLast={index === places.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// Recommendation Card (Kakao Map Style)
// ============================================

interface RecommendationCardProps {
  place: PlaceWithDistance;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function RecommendationCard({ place, onPress, isFirst, isLast }: RecommendationCardProps) {
  // Stable rating based on place ID (no re-render flickering)
  const { rating, reviewCount } = useMemo(() => generateStableRating(place.id), [place.id]);
  const distanceText =
    place.distance !== undefined
      ? place.distance < 1000
        ? COPY.DISTANCE_M(Math.round(place.distance))
        : COPY.DISTANCE_KM((place.distance / 1000).toFixed(1))
      : '';

  return (
    <TouchableOpacity
      style={[styles.card, isFirst && styles.cardFirst, isLast && styles.cardLast]}
      onPress={onPress}
      activeOpacity={0.9}
      accessible={true}
      accessibilityLabel={`${place.name}, ${COPY.RATING_LABEL(parseFloat(rating.toFixed(1)), reviewCount)}${distanceText ? `, ${distanceText}` : ''}`}
      accessibilityRole="button"
      accessibilityHint={COPY.A11Y_ACTIVATE_HINT}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {place.thumbnailUrl ? (
          <Image
            source={{ uri: place.thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
            accessible={false}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        {/* Distance badge (top-right) */}
        {place.distance !== undefined && (
          <View style={styles.distanceBadge} accessible={false}>
            <Text style={styles.distanceText}>
              {place.distance < 1000
                ? COPY.DISTANCE_M(Math.round(place.distance))
                : COPY.DISTANCE_KM((place.distance / 1000).toFixed(1))}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Name */}
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>

        {/* Rating + Reviews (text only, iOS 26 style) */}
        <Text style={styles.placeRating}>
          {rating.toFixed(1)} · {COPY.REVIEWS_COUNT(reviewCount)}
        </Text>

        {/* Address */}
        {place.address && (
          <Text style={styles.placeAddress} numberOfLines={1}>
            {place.address}
          </Text>
        )}

        {/* Amenities (text only, separated by ·) */}
        <View style={styles.amenitiesRow}>
          {place.admissionFee?.isFree && (
            <Text style={styles.amenityText}>{COPY.AMENITY_FREE}</Text>
          )}
          {place.amenities?.parking && (
            <>
              {place.admissionFee?.isFree && <Text style={styles.separator}>·</Text>}
              <Text style={styles.amenityText}>{COPY.AMENITY_PARKING}</Text>
            </>
          )}
          {place.amenities?.nursingRoom && (
            <>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.amenityText}>{COPY.AMENITY_NURSING_ROOM}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.iosLabel,
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.iosSystemBlue,
  },
  scrollContent: {
    paddingHorizontal: 16 - CARD_SPACING / 2,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: CARD_SPACING / 2,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFirst: {
    marginLeft: 0,
  },
  cardLast: {
    marginRight: 0,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.iosSecondaryBackground,
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.overlayDark, // Glassmorphism
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  cardContent: {
    padding: 16,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.iosLabel,
    marginBottom: 4,
  },
  placeRating: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.iosSecondaryLabel,
    marginBottom: 6,
  },
  placeAddress: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    marginBottom: 8,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
  },
  separator: {
    fontSize: 12,
    color: Colors.iosTertiaryLabel,
    marginHorizontal: 4,
  },
});
