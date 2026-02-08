/**
 * HalfCard - Bottom Sheet Half Level (50%)
 *
 * Detailed: image + name + rating + amenities + insights + actions + reviews preview
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { InsightCard } from '@/app/components/dataBlock';
import { ActionButton, Pill, ReviewItem, OptimizedImage } from '@/app/components/shared';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { PlaceWithDistance } from '@/app/types/places';
import type { PlaceInsights } from '@/app/types/dataBlock';
import type { RootStackNavigationProp } from '@/app/types/navigation';

interface HalfCardProps {
  place: PlaceWithDistance;
  insights?: PlaceInsights;
}

function HalfCardInner({ place, insights }: HalfCardProps) {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View>
      {place.thumbnailUrl && (
        <OptimizedImage uri={place.thumbnailUrl} style={styles.image} alt={`${place.name} image`} />
      )}

      <Text style={styles.placeName}>{place.name}</Text>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={18} color={Colors.iosSystemOrange} />
        <Text style={styles.placeRating}>
          {place.rating ?? 4.6} · {COPY.REVIEWS_COUNT(place.reviewCount ?? 0)}
        </Text>
      </View>

      <View style={styles.quickInfo}>
        {place.distance !== undefined && (
          <Text style={styles.infoText}>
            {place.distance < 1000
              ? COPY.DISTANCE_M(Math.round(place.distance))
              : COPY.DISTANCE_KM((place.distance / 1000).toFixed(1))}
          </Text>
        )}
        {place.address && (
          <Text style={styles.infoText} numberOfLines={1}>
            {place.address}
          </Text>
        )}
      </View>

      <View style={styles.amenitiesRow}>
        {place.admissionFee?.isFree && <Pill text={COPY.AMENITY_FREE} color={Colors.successMint} />}
        {place.amenities?.parking && <Pill text={COPY.AMENITY_PARKING} />}
        {place.amenities?.nursingRoom && <Pill text={COPY.AMENITY_NURSING_ROOM} />}
      </View>

      {insights && (
        <View style={styles.insightSection}>
          <Text style={styles.sectionTitle}>{COPY.SECTION_TODAY_INSIGHTS}</Text>
          <View style={styles.insightGrid}>
            {insights.waitTime && <InsightCard label="대기 시간" block={insights.waitTime} />}
            {insights.dealCount && <InsightCard label="딜" block={insights.dealCount} />}
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        <ActionButton icon="call-outline" label={COPY.ACTION_CALL} />
        <ActionButton icon="navigate-outline" label={COPY.ACTION_DIRECTIONS} />
        <ActionButton icon="share-outline" label={COPY.ACTION_SHARE} />
        <ActionButton icon="bookmark-outline" label={COPY.ACTION_SAVE} />
        <ActionButton
          icon="information-circle-outline"
          label={COPY.ACTION_DETAILS}
          onPress={() => navigation.navigate('PlaceDetail')}
        />
      </View>

      <View style={styles.reviewsPreview}>
        <Text style={styles.sectionTitle}>{COPY.SECTION_REVIEWS}</Text>
        <ReviewItem author="김OO" rating={5} text="아이들이 정말 좋아해요!" date="2일 전" />
        <ReviewItem
          author="이OO"
          rating={4}
          text="시설 깨끗하고 직원분들 친절해요"
          date="1주일 전"
        />
      </View>
    </View>
  );
}

export const HalfCard = React.memo(HalfCardInner);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.darkSurfaceElevated,
  },
  placeName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: Colors.darkTextPrimary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeRating: {
    fontSize: 17,
    color: Colors.darkTextSecondary,
  },
  quickInfo: {
    marginTop: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.darkTextTertiary,
    marginBottom: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  insightSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  insightGrid: {
    marginTop: 10,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.darkTextPrimary,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.darkBorder,
    marginBottom: 20,
  },
  reviewsPreview: {
    marginTop: 20,
  },
});
