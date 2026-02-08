/**
 * PeerTrendWidget - 또래 트렌드 위젯
 *
 * Dark-first 2026 디자인
 * - 텍스트 중심, 큰 숫자
 * - Borderless cards on dark surface
 * - Mint accent for active states
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import type {
  PeerTrends,
  PeerTrendingPlace,
  PeerTrendingGroupBuy,
  TrendPeriod,
} from '@/app/types/peerSync';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

// ============================================
// Types
// ============================================

export interface PeerTrendWidgetProps {
  trends: PeerTrends;
  onPlacePress?: (placeId: string) => void;
  onGroupBuyPress?: (groupBuyId: string) => void;
  onSeeAllPress?: (type: 'places' | 'groupbuys') => void;
  testID?: string;
}

// ============================================
// Sub-components
// ============================================

function TrendingPlaceItem({
  place,
  rank,
  onPress,
}: {
  place: PeerTrendingPlace;
  rank: number;
  onPress?: () => void;
}) {
  return (
    <TamaguiPressableScale style={styles.placeCard} onPress={onPress} hapticType="light">
      <View style={styles.placeImageContainer}>
        <Image
          source={{ uri: place.place.thumbnailUrl || 'https://picsum.photos/140/100' }}
          style={styles.placeImage}
          resizeMode="cover"
        />
        <View style={[styles.rankBadge, rank === 1 && styles.rankBadgeTop]}>
          <TamaguiText preset="caption" weight="bold" textColor="inverse" style={styles.rankText}>
            {rank}
          </TamaguiText>
        </View>
      </View>

      <TamaguiText
        preset="body"
        textColor="primary"
        weight="semibold"
        style={styles.placeName}
        numberOfLines={1}
      >
        {place.place.name}
      </TamaguiText>

      <TamaguiText preset="caption" textColor="tertiary" style={styles.placeStats}>
        {place.peerVisitCount}명 방문
      </TamaguiText>
    </TamaguiPressableScale>
  );
}

function TrendingGroupBuyItem({
  groupBuy,
  onPress,
}: {
  groupBuy: PeerTrendingGroupBuy;
  onPress?: () => void;
}) {
  return (
    <TamaguiPressableScale style={styles.groupBuyCard} onPress={onPress} hapticType="light">
      <View style={styles.groupBuyImageContainer}>
        <Image
          source={{ uri: groupBuy.thumbnailUrl || 'https://picsum.photos/180/100' }}
          style={styles.groupBuyImage}
          resizeMode="cover"
        />
        <View style={styles.discountBadge}>
          <TamaguiText
            preset="caption"
            weight="bold"
            textColor="inverse"
            style={styles.discountText}
          >
            {groupBuy.discountPercent}%
          </TamaguiText>
        </View>
      </View>

      <TamaguiText
        preset="body"
        textColor="primary"
        weight="semibold"
        style={styles.groupBuyTitle}
        numberOfLines={2}
      >
        {groupBuy.title}
      </TamaguiText>

      <TamaguiText preset="h3" textColor="primary" weight="bold" style={styles.discountPrice}>
        {groupBuy.discountedPrice.toLocaleString()}
      </TamaguiText>

      <TamaguiText preset="caption" textColor="tertiary" style={styles.groupBuyStats}>
        {groupBuy.peerParticipantCount} joined
      </TamaguiText>
    </TamaguiPressableScale>
  );
}

// ============================================
// Period Chip
// ============================================

function PeriodChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TamaguiPressableScale style={styles.periodChip} onPress={onPress} hapticType="light">
      <TamaguiText
        preset="body"
        textColor={selected ? 'primary' : 'tertiary'}
        weight={selected ? 'bold' : 'medium'}
        style={[styles.periodChipText, selected && styles.periodChipTextActive]}
      >
        {label}
      </TamaguiText>
      {selected && <View style={styles.periodUnderline} />}
    </TamaguiPressableScale>
  );
}

// ============================================
// Main Component
// ============================================

export function PeerTrendWidget({
  trends,
  onPlacePress,
  onGroupBuyPress,
  onSeeAllPress,
  testID,
}: PeerTrendWidgetProps) {
  const [period, setPeriod] = useState<TrendPeriod>('week');

  const periodLabels: Record<TrendPeriod, string> = {
    today: '오늘',
    week: '이번 주',
    month: '이번 달',
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as TrendPeriod[]).map((p) => (
          <PeriodChip
            key={p}
            label={periodLabels[p]}
            selected={period === p}
            onPress={() => setPeriod(p)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TamaguiText preset="body" textColor="primary" weight="bold" style={styles.sectionTitle}>
            인기 장소
          </TamaguiText>
          <TamaguiPressableScale
            onPress={() => onSeeAllPress?.('places')}
            hapticType="light"
            style={{ padding: 8, margin: -8 }}
          >
            <TamaguiText preset="caption" weight="medium" style={styles.seeAllText}>
              전체보기
            </TamaguiText>
          </TamaguiPressableScale>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {trends.topPlaces.slice(0, 5).map((place, index) => (
            <TrendingPlaceItem
              key={place.place.id}
              place={place}
              rank={index + 1}
              onPress={() => onPlacePress?.(place.place.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TamaguiText preset="body" textColor="primary" weight="bold" style={styles.sectionTitle}>
            인기 공구
          </TamaguiText>
          <TamaguiPressableScale
            onPress={() => onSeeAllPress?.('groupbuys')}
            hapticType="light"
            style={{ padding: 8, margin: -8 }}
          >
            <TamaguiText preset="caption" weight="medium" style={styles.seeAllText}>
              전체보기
            </TamaguiText>
          </TamaguiPressableScale>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {trends.topGroupBuys.slice(0, 3).map((groupBuy) => (
            <TrendingGroupBuyItem
              key={groupBuy.id}
              groupBuy={groupBuy}
              onPress={() => onGroupBuyPress?.(groupBuy.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================
// Styles — Dark-first
// ============================================

const styles = StyleSheet.create({
  container: {
    gap: 28,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
  },
  periodChip: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextTertiary,
  },
  periodChipTextActive: {
    fontWeight: '700',
    color: Colors.darkTextPrimary,
  },
  periodUnderline: {
    marginTop: 4,
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },

  // Section
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.darkTextTertiary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingRight: 36,
  },

  // Place Card
  placeCard: {
    width: 140,
    marginRight: 12,
  },
  placeImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  placeImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.darkSurfaceElevated,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.darkTextSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: Colors.primary,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkBg,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  placeStats: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
    marginTop: 2,
  },

  // Group Buy Card
  groupBuyCard: {
    width: 180,
    marginRight: 12,
    padding: 14,
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
  },
  groupBuyImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  groupBuyImage: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    backgroundColor: Colors.darkSurfaceElevated,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.iosSystemOrange,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  groupBuyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
    lineHeight: 18,
    marginBottom: 4,
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  groupBuyStats: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    marginTop: 4,
  },
});

export default PeerTrendWidget;
