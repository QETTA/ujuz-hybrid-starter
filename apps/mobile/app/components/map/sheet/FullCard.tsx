/**
 * FullCard - Bottom Sheet Full Level (90%)
 *
 * Complete: image + trust panel + insights + actions + group buy + shorts + reviews + report
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { TamaguiText } from '@/app/design-system';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { ConfidenceBadge, InsightCard, ProvenanceFooter } from '@/app/components/dataBlock';
import GroupBuyButton from '@/app/components/place/GroupBuyButton';
import {
  ActionButton,
  Pill,
  ReviewItem,
  ShortsGallery,
  OptimizedImage,
} from '@/app/components/shared';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { PlaceWithDistance } from '@/app/types/places';
import type { DataBlock, PlaceInsights } from '@/app/types/dataBlock';
import type { RootStackNavigationProp } from '@/app/types/navigation';

interface FullCardProps {
  place: PlaceWithDistance;
  insights?: PlaceInsights;
}

const mockShorts = [
  { id: 's1', thumbnail: 'https://picsum.photos/120/200?random=60', views: '1.2K' },
  { id: 's2', thumbnail: 'https://picsum.photos/120/200?random=61', views: '856' },
  { id: 's3', thumbnail: 'https://picsum.photos/120/200?random=62', views: '2.1K' },
];

function FullCardInner({ place, insights }: FullCardProps) {
  const navigation = useNavigation<RootStackNavigationProp>();

  const blocks = useMemo(() => {
    if (!insights) return [];
    return Object.values(insights).filter((b): b is DataBlock => b != null);
  }, [insights]);

  const overallConfidence = useMemo(() => {
    if (blocks.length === 0) return 0.5;
    return blocks.reduce((acc, b) => acc + b.confidence, 0) / blocks.length;
  }, [blocks]);

  return (
    <View>
      {place.thumbnailUrl && (
        <OptimizedImage uri={place.thumbnailUrl} style={styles.image} alt={`${place.name} image`} />
      )}

      {/* Title & Rating */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <TamaguiText style={styles.placeName} accessibilityRole="header">
            {place.name}
          </TamaguiText>
          <View
            style={styles.ratingRow}
            accessible={true}
            accessibilityLabel={COPY.RATING_LABEL(place.rating ?? 4.6, place.reviewCount ?? 0)}
            accessibilityHint="별점 및 리뷰 수"
          >
            <Ionicons name="star" size={18} color={Colors.iosSystemOrange} />
            <TamaguiText style={styles.placeRating}>
              {place.rating ?? 4.6} · {COPY.REVIEWS_COUNT(place.reviewCount ?? 0)}
            </TamaguiText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          accessible={true}
          accessibilityLabel={COPY.A11Y_FAVORITE}
          accessibilityRole="button"
          accessibilityHint={COPY.A11Y_FAVORITE_HINT}
        >
          <Ionicons name="heart-outline" size={28} color={Colors.iosTertiaryLabel} />
        </TouchableOpacity>
      </View>

      {place.address && <TamaguiText style={styles.addressText}>{place.address}</TamaguiText>}
      {place.distance !== undefined && (
        <TamaguiText style={styles.distanceText}>
          {place.distance < 1000
            ? COPY.DISTANCE_M(Math.round(place.distance))
            : COPY.DISTANCE_KM((place.distance / 1000).toFixed(1))}
        </TamaguiText>
      )}

      {/* Trust Panel */}
      <View style={styles.trustPanel}>
        <View style={styles.trustHeader}>
          <TamaguiText style={styles.trustTitle}>{COPY.TRUST_TITLE}</TamaguiText>
          <ConfidenceBadge confidence={overallConfidence} size="sm" />
        </View>
        {blocks[0] && <ProvenanceFooter block={blocks[0]} compact />}
      </View>

      {/* Amenities */}
      <View style={styles.amenitiesRow}>
        {place.admissionFee?.isFree && <Pill text={COPY.AMENITY_FREE} color={Colors.successMint} />}
        {place.amenities?.parking && <Pill text={COPY.AMENITY_PARKING} />}
        {place.amenities?.nursingRoom && <Pill text={COPY.AMENITY_NURSING_ROOM} />}
        {place.amenities?.diaperChangingStation && <Pill text={COPY.AMENITY_DIAPER_STATION} />}
      </View>

      {/* Insights */}
      {insights && (
        <View style={styles.section}>
          <TamaguiText style={styles.sectionTitle}>{COPY.SECTION_INSIGHTS}</TamaguiText>
          <View style={styles.insightGrid}>
            {insights.waitTime && <InsightCard label="대기 시간" block={insights.waitTime} />}
            {insights.crowdLevel && <InsightCard label="혼잡도" block={insights.crowdLevel} />}
            {insights.safetyScore && <InsightCard label="안전 평가" block={insights.safetyScore} />}
            {insights.peerVisits && <InsightCard label="또래 방문" block={insights.peerVisits} />}
          </View>
        </View>
      )}

      {/* Actions */}
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

      {/* Group Buy */}
      <View style={styles.section}>
        <GroupBuyButton
          originalPrice={place.admissionFee?.child || 15000}
          discountedPrice={12000}
          discountPercent={20}
          currentParticipants={8}
          targetParticipants={10}
          deadline="23:59 today"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          variant="detail"
        />
      </View>

      {/* Shorts Gallery */}
      <View style={styles.section}>
        <TamaguiText style={styles.sectionTitle}>{COPY.SECTION_VIDEOS}</TamaguiText>
        <ShortsGallery shorts={mockShorts} />
      </View>

      {/* Reviews */}
      <View
        style={styles.section}
        accessibilityRole="summary"
        accessibilityLabel={COPY.SECTION_REVIEWS}
      >
        <View style={styles.sectionHeader}>
          <TamaguiText style={styles.sectionTitle} accessibilityRole="header">
            {COPY.SECTION_REVIEWS}
          </TamaguiText>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={COPY.A11Y_REVIEWS_ALL}
            accessibilityRole="button"
            accessibilityHint={COPY.A11Y_REVIEWS_ALL_HINT}
          >
            <TamaguiText style={styles.seeAllText}>{COPY.SEE_ALL}</TamaguiText>
          </TouchableOpacity>
        </View>
        <ReviewItem
          author="김OO"
          rating={5}
          text="아이들이 정말 좋아해요! 시설도 깨끗하고 직원분들도 친절하세요."
          date="2일 전"
        />
        <ReviewItem
          author="이OO"
          rating={4}
          text="시설 깨끗하고 직원분들 친절해요"
          date="1주일 전"
        />
      </View>

      {/* About */}
      {place.description && (
        <View style={styles.section}>
          <TamaguiText style={styles.sectionTitle}>{COPY.SECTION_ABOUT}</TamaguiText>
          <TamaguiText style={styles.sectionText}>{place.description}</TamaguiText>
        </View>
      )}

      <Pressable
        style={styles.reportButton}
        onPress={() => navigation.navigate('Report')}
        accessibilityRole="button"
      >
        <TamaguiText style={styles.reportButtonText}>정보 정정/신고</TamaguiText>
      </Pressable>
    </View>
  );
}

export const FullCard = React.memo(FullCardInner);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.iosSecondaryBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  placeName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: Colors.iosLabel,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeRating: {
    fontSize: 17,
    color: Colors.iosSecondaryLabel,
  },
  addressText: {
    fontSize: 15,
    color: Colors.iosSecondaryLabel,
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 15,
    color: Colors.iosTertiaryLabel,
    marginBottom: 12,
  },
  trustPanel: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.tossGray50,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tossGray600,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  insightGrid: {
    marginTop: 10,
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.iosSecondaryBackground,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.iosLabel,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 17,
    color: Colors.link,
  },
  sectionText: {
    fontSize: 17,
    color: Colors.iosSecondaryLabel,
    lineHeight: 24,
  },
  reportButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.tossGray50,
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.tossGray600,
  },
});
