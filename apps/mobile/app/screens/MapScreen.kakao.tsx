/**
 * MapScreen - Toss Style + User Data Visualization
 *
 * 토스 디자인 + 사용자 데이터 시각화:
 * - 미니멀 UI
 * - 또래 활동, 공동육아 데이터 표시
 * - 나중에 react-native-maps로 교체 가능
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { TamaguiPressableScale } from '@/app/design-system';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { COPY } from '@/app/copy/copy.ko';

import { KakaoMapView, ThreeSnapBottomSheet } from '@/app/components/map';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import { Colors, Shadows } from '@/app/constants';
import { placesService } from '@/app/services/mongo/places';
import { useInsights } from '@/app/hooks/useInsights';
import { useFilterStore } from '@/app/stores/filterStore';
import { useMapStore } from '@/app/stores/mapStore';
import { usePlaceStore } from '@/app/stores/placeStore';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import type { MapScreenNavigationProp } from '@/app/types/navigation';
import type { PlaceWithDistance } from '@/app/types/places';
import type { DataBlock } from '@/app/types/dataBlock';

// ============================================
// Design Tokens (Toss Style)
// ============================================
const C = {
  text: {
    primary: Colors.darkTextPrimary,
    secondary: Colors.darkTextSecondary,
    tertiary: Colors.darkTextTertiary,
    inverse: Colors.darkBg,
  },
  bg: {
    primary: Colors.darkBg,
    secondary: Colors.darkSurface,
    glass: 'rgba(10, 10, 10, 0.85)',
  },
  brand: {
    primary: Colors.primary,
    blue: Colors.primary,
  },
  status: {
    live: Colors.error,
    success: Colors.success,
  },
};

// ============================================
// Insight Helpers
// ============================================

function toNumericValue(value: DataBlock['value'] | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/[\d.]+/);
    return match ? Number.parseFloat(match[0]) : 0;
  }
  return 0;
}

function getBlockValue(block?: DataBlock): number {
  if (!block) return 0;
  return toNumericValue(block.value);
}

// ============================================
// Main Component
// ============================================

export default function MapScreen() {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  useAnalytics('Map');

  const { center, requestUserLocation, isLocating } = useMapStore();
  const { selectPlace, selectedPlace, favorites } = usePlaceStore();
  const { filterCategory, placeCategories, maxDistance } = useFilterStore();

  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const placeIds = useMemo(() => places.map((p) => p.id), [places]);
  const { insightsMap } = useInsights(placeIds);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    let cancelled = false;
    const loadPlaces = async () => {
      const { places: result } = await placesService.searchNearby({
        lat: center.lat,
        lng: center.lng,
        radius: maxDistance ?? 5000,
        categories: placeCategories.length > 0 ? placeCategories : undefined,
        limit: 80,
      });
      if (!cancelled) {
        setPlaces(result);
      }
    };

    void loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, placeCategories.join(','), maxDistance, filterCategory]);

  useEffect(() => {
    if (selectedPlace) {
      bottomSheetRef.current?.snapToIndex(1);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [selectedPlace]);

  const visiblePlaces = useMemo(() => {
    if (activeFilter === 'all') return places;
    if (activeFilter === 'saved') {
      return places.filter((place) => favoritesSet.has(place.id));
    }
    if (insightsMap.size === 0) return places;

    if (activeFilter === 'deals') {
      return places.filter((place) => getBlockValue(insightsMap.get(place.id)?.dealCount) > 0);
    }

    if (activeFilter === 'peers') {
      return places.filter((place) => getBlockValue(insightsMap.get(place.id)?.peerVisits) > 0);
    }

    return places;
  }, [activeFilter, favoritesSet, insightsMap, places]);

  useEffect(() => {
    if (selectedPlace && !visiblePlaces.some((place) => place.id === selectedPlace.id)) {
      selectPlace(null);
    }
  }, [selectedPlace, selectPlace, visiblePlaces]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      const place = places.find((p) => p.id === markerId);
      if (place) {
        selectPlace(place);
      }
    },
    [places, selectPlace]
  );

  const handleGPSPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestUserLocation();
  }, [requestUserLocation]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const handleBottomSheetClose = useCallback(() => {
    selectPlace(null);
  }, [selectPlace]);

  const filterCounts = useMemo(() => {
    const savedCount = places.filter((place) => favoritesSet.has(place.id)).length;
    const dealsCount = places.filter(
      (place) => getBlockValue(insightsMap.get(place.id)?.dealCount) > 0
    ).length;
    const peersCount = places.filter(
      (place) => getBlockValue(insightsMap.get(place.id)?.peerVisits) > 0
    ).length;

    return { savedCount, dealsCount, peersCount };
  }, [favoritesSet, insightsMap, places]);

  // Prepare markers for map
  const mapMarkers = useMemo(
    () =>
      visiblePlaces
        .map((place) => ({
          id: place.id,
          position: { lat: place.latitude || 0, lng: place.longitude || 0 },
          title: place.name,
        }))
        .filter((marker) => marker.position.lat !== 0 && marker.position.lng !== 0),
    [visiblePlaces]
  );

  const stats = useMemo(() => {
    const visibleInsights = Array.from(visiblePlaces)
      .map((place) => insightsMap.get(place.id))
      .filter(Boolean);

    const blocks = visibleInsights.flatMap((insight) =>
      Object.values(insight || {}).filter((b): b is DataBlock => b != null)
    );

    const overallConfidence =
      blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length : 0.5;
    const sourceCount = new Set(blocks.map((b) => b.source)).size;

    const peerVisitsTotal = visibleInsights.reduce(
      (sum, insight) => sum + getBlockValue(insight?.peerVisits),
      0
    );
    const peerPlaceCount = visibleInsights.filter(
      (insight) => getBlockValue(insight?.peerVisits) > 0
    ).length;
    const dealCountTotal = visibleInsights.reduce(
      (sum, insight) => sum + getBlockValue(insight?.dealCount),
      0
    );

    const latest = blocks.reduce((latestDate, block) => {
      const date = block.updatedAt instanceof Date ? block.updatedAt : new Date(block.updatedAt);
      return date > latestDate ? date : latestDate;
    }, new Date(0));
    const updatedLabel =
      latest.getTime() > 0 ? formatDistanceToNow(latest, { addSuffix: true, locale: ko }) : null;

    return {
      blockCount: blocks.length,
      overallConfidence,
      sourceCount,
      peerVisitsTotal,
      peerPlaceCount,
      dealCountTotal,
      updatedLabel,
    };
  }, [insightsMap, visiblePlaces]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <KakaoMapView
        center={center}
        zoom={3}
        markers={mapMarkers}
        onMarkerPress={handleMarkerPress}
      />

      {/* Top Bar - Glass Style */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Search Bar */}
        <TamaguiPressableScale
          style={styles.searchBar}
          onPress={handleSearchPress}
          hapticType="light"
          accessibilityLabel="장소 검색"
          accessibilityHint="검색 화면으로 이동합니다"
        >
          <Text style={styles.searchPlaceholder}>{COPY.MAP_SEARCH_PLACEHOLDER}</Text>
          <Ionicons name="search" size={18} color={C.text.tertiary} />
        </TamaguiPressableScale>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { key: 'all', label: COPY.MAP_FILTER_ALL },
            { key: 'peers', label: COPY.MAP_FILTER_PEERS, count: filterCounts.peersCount },
            { key: 'deals', label: COPY.MAP_FILTER_DEALS, count: filterCounts.dealsCount },
            { key: 'saved', label: COPY.MAP_FILTER_SAVED, count: filterCounts.savedCount },
          ].map((filter) => (
            <TamaguiPressableScale
              key={filter.key}
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              onPress={() => handleFilterChange(filter.key)}
              accessibilityLabel={`${filter.label} 필터`}
            >
              <View style={styles.filterLabelRow}>
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter.key && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
                {typeof filter.count === 'number' && (
                  <View
                    style={[
                      styles.filterBadge,
                      filter.count === 0 && styles.filterBadgeMuted,
                      activeFilter === filter.key && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        filter.count === 0 && styles.filterBadgeTextMuted,
                        activeFilter === filter.key && styles.filterBadgeTextActive,
                      ]}
                    >
                      {filter.count}
                    </Text>
                  </View>
                )}
              </View>
            </TamaguiPressableScale>
          ))}
        </ScrollView>
      </View>

      {/* Floating Stats Card */}
      <View style={[styles.statsCard, { bottom: 120 + insets.bottom }]}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>{COPY.MAP_PLACES_NEARBY(visiblePlaces.length)}</Text>
          <ConfidenceBadge confidence={stats.overallConfidence} size="sm" />
        </View>
        <Text style={styles.statsSub}>
          {COPY.TRUST_ROW(
            stats.blockCount,
            stats.sourceCount,
            Math.round(stats.overallConfidence * 100)
          )}
          {stats.updatedLabel ? ` · 업데이트 ${stats.updatedLabel}` : ''}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: C.status.live }]} />
            <Text style={styles.statValue}>{Math.round(stats.peerVisitsTotal)}</Text>
            <Text style={styles.statLabel}>{COPY.MAP_STAT_PEERS}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.peerPlaceCount}</Text>
            <Text style={styles.statLabel}>{COPY.MAP_STAT_COPARENT}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(stats.dealCountTotal)}</Text>
            <Text style={styles.statLabel}>{COPY.MAP_STAT_DEALS}</Text>
          </View>
        </View>
      </View>

      {visiblePlaces.length === 0 && (
        <View style={[styles.emptyCard, { bottom: 60 + insets.bottom }]}>
          <Text style={styles.emptyTitle}>{COPY.NO_FILTER_MATCH}</Text>
          <View style={styles.emptyActions}>
            <TamaguiPressableScale
              style={styles.emptyCta}
              onPress={() => setActiveFilter('all')}
              accessibilityLabel="필터 초기화"
            >
              <Text style={styles.emptyCtaText}>{COPY.RESET_FILTER}</Text>
            </TamaguiPressableScale>
            <TamaguiPressableScale
              style={styles.emptySecondary}
              onPress={() => navigation.navigate('Ask')}
              accessibilityLabel="우주봇에게 질문하기"
            >
              <Text style={styles.emptySecondaryText}>{COPY.ASK_UJU}</Text>
            </TamaguiPressableScale>
          </View>
        </View>
      )}

      {/* GPS Button */}
      <TamaguiPressableScale
        style={[styles.gpsButton, { bottom: 200 + insets.bottom }]}
        onPress={handleGPSPress}
        hapticType="medium"
        accessibilityLabel="현재 위치로 이동"
      >
        <Ionicons
          name={isLocating ? 'locate' : 'locate-outline'}
          size={22}
          color={isLocating ? C.brand.blue : C.text.primary}
        />
      </TamaguiPressableScale>

      {/* Bottom Sheet for Place Details */}
      <ThreeSnapBottomSheet
        ref={bottomSheetRef}
        onClose={handleBottomSheetClose}
        insightsMap={insightsMap}
      />
    </View>
  );
}

// ============================================
// Styles (Toss Design System)
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg.primary,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.bg.glass,
    zIndex: 10,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: C.bg.secondary,
    borderRadius: 12,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: C.text.tertiary,
  },

  // Filter Chips
  filterScroll: {
    marginTop: 12,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: C.bg.secondary,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: C.text.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text.secondary,
  },
  filterTextActive: {
    color: C.text.inverse,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkBg,
  },
  filterBadgeMuted: {
    backgroundColor: Colors.darkSurface,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.text.primary,
  },
  filterBadgeTextMuted: {
    color: C.text.tertiary,
  },
  filterBadgeTextActive: {
    color: C.text.primary,
  },

  // Stats Card
  statsCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: C.bg.glass,
    borderRadius: 16,
    padding: 16,
    zIndex: 5,
    ...Shadows.md,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text.primary,
    letterSpacing: -0.2,
  },
  statsSub: {
    fontSize: 12,
    color: C.text.tertiary,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text.primary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: C.text.tertiary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.bg.secondary,
  },

  // GPS Button
  gpsButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.bg.glass,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    ...Shadows.md,
  },

  emptyCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: C.bg.glass,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    ...Shadows.md,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text.secondary,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyCta: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: C.text.primary,
  },
  emptyCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text.inverse,
  },
  emptySecondary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  emptySecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text.secondary,
  },
});
