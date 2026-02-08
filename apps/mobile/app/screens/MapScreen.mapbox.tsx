/**
 * MapScreen - Mapbox First (Toss-minimal) + User Data Visualization
 *
 * 목표:
 * - Kakao WebView 기반 지도 → Mapbox Native SDK로 전환
 * - uju UX 원칙: Map은 도구, 상단의 '인텔리전스/컨텍스트'가 중심
 * - peers / deals / saved 레이어를 최소 토글로 제공 (선택 피로 ↓)
 *
 * Refactored:
 * - GeoJSON 변환 → map/utils/geojson.ts
 * - 레이어 필터링 → map/hooks/useMapLayers.ts
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

import { MapboxMapView, ThreeSnapBottomSheet } from '@/app/components/map';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import {
  TamaguiEmptyState,
  TamaguiGlassCard,
  TamaguiText,
  TamaguiPressableScale,
} from '@/app/design-system';
import { Colors, Shadows } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { MOCK_MAP_PLACES } from '@/app/data/mocks';
import { useInsights } from '@/app/hooks/useInsights';
import { useFilterStore } from '@/app/stores/filterStore';
import { useMapStore } from '@/app/stores/mapStore';
import { usePlaceStore } from '@/app/stores/placeStore';
import { useMapLayers } from '@/app/components/map/hooks/useMapLayers';
import { getBlockValue } from '@/app/components/map/utils/geojson';
import type { MapLayerKey } from '@/app/components/map/hooks/useMapLayers';
import type { MapScreenNavigationProp } from '@/app/types/navigation';
import type { PlaceWithDistance } from '@/app/types/places';
import type { DataBlock } from '@/app/types/dataBlock';

export default function MapScreenMapbox() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MapScreenNavigationProp>();

  const { filterCategory } = useFilterStore();
  const { center, zoom, setCenter, setZoom } = useMapStore();
  const { selectPlace, selectedPlace, favorites } = usePlaceStore();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>('all');
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const placeIds = useMemo(() => places.map((p) => p.id), [places]);
  const { insightsMap } = useInsights(placeIds);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    // TODO: replace with real API + data blocks
    setPlaces(MOCK_MAP_PLACES);
  }, []);

  const { visiblePlaces, mapLayers, filterCounts } = useMapLayers({
    places,
    activeLayer,
    favoritesSet,
    insightsMap,
  });

  useEffect(() => {
    if (selectedPlace && !visiblePlaces.some((place) => place.id === selectedPlace.id)) {
      selectPlace(null);
    }
  }, [selectedPlace, selectPlace, visiblePlaces]);

  const handlePlaceSelect = useCallback(
    (placeId: string) => {
      const place = places.find((p) => p.id === placeId);
      if (!place) return;
      selectPlace(place);
      bottomSheetRef.current?.snapToIndex(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [places, selectPlace]
  );

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const handleMyLocationPress = useCallback(() => {
    // TODO: hook into expo-location and update center
  }, []);

  const layerChips = useMemo(
    () => [
      { key: 'all' as const, label: COPY.MAP_FILTER_ALL, count: undefined },
      { key: 'peers' as const, label: COPY.MAP_FILTER_PEERS, count: filterCounts.peersCount },
      { key: 'deals' as const, label: COPY.MAP_FILTER_DEALS, count: filterCounts.dealsCount },
      { key: 'saved' as const, label: COPY.MAP_FILTER_SAVED, count: filterCounts.savedCount },
    ],
    [filterCounts]
  );

  const stats = useMemo(() => {
    const nearbyCount = visiblePlaces.length;

    const visibleInsights = Array.from(visiblePlaces)
      .map((place) => insightsMap.get(place.id))
      .filter(Boolean);
    const blocks = visibleInsights.flatMap((insight) =>
      Object.values(insight || {}).filter((b): b is DataBlock => b != null)
    );
    const overallConfidence =
      blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length : 0;
    const sourceCount = new Set(blocks.map((b) => b.source)).size;

    const peerPlaceCount = visibleInsights.filter(
      (insight) => getBlockValue(insight?.peerVisits) > 0
    ).length;

    return {
      nearbyCount,
      coParenting: peerPlaceCount,
      filterCategory,
      blockCount: blocks.length,
      overallConfidence,
      sourceCount,
    };
  }, [visiblePlaces, filterCategory, insightsMap]);

  return (
    <View style={styles.container}>
      <MapboxMapView
        center={{ lng: center.lng, lat: center.lat }}
        zoom={zoom}
        layers={mapLayers}
        activeLayer={activeLayer}
        showUserLocation
        onPlacePress={handlePlaceSelect}
        onRegionDidChange={({ center: nextCenter, zoom: nextZoom }) => {
          setCenter({ lat: nextCenter.lat, lng: nextCenter.lng });
          setZoom(nextZoom);
        }}
      />

      {/* Header (minimal) */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TamaguiPressableScale
          onPress={handleSearchPress}
          hapticType="light"
          style={styles.searchBar}
          accessibilityLabel="장소 검색"
          accessibilityHint="검색 화면으로 이동합니다"
        >
          <TamaguiText
            preset="body"
            textColor="primary"
            weight="semibold"
            style={styles.searchText}
          >
            {COPY.MAP_SEARCH_PLACEHOLDER}
          </TamaguiText>
          <TamaguiText
            preset="caption"
            textColor="tertiary"
            weight="bold"
            style={styles.searchHint}
          >
            ⌘K
          </TamaguiText>
        </TamaguiPressableScale>
      </View>

      {/* Layer chips */}
      <View style={styles.layerChips}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {layerChips.map((chip) => (
            <TamaguiPressableScale
              key={chip.key}
              onPress={() => setActiveLayer(chip.key)}
              hapticType="light"
              style={[styles.chip, activeLayer === chip.key && styles.chipActive]}
              accessibilityLabel={`${chip.label} 필터`}
            >
              <View style={styles.chipLabelRow}>
                <TamaguiText
                  preset="caption"
                  textColor={activeLayer === chip.key ? 'inverse' : 'secondary'}
                  weight="semibold"
                  style={styles.chipText}
                >
                  {chip.label}
                </TamaguiText>
                {typeof chip.count === 'number' && (
                  <View
                    style={[
                      styles.chipBadge,
                      chip.count === 0 && styles.chipBadgeMuted,
                      activeLayer === chip.key && styles.chipBadgeActive,
                    ]}
                  >
                    <TamaguiText
                      preset="caption"
                      textColor={chip.count === 0 ? 'tertiary' : 'primary'}
                      weight="bold"
                      style={styles.chipBadgeText}
                    >
                      {chip.count}
                    </TamaguiText>
                  </View>
                )}
              </View>
            </TamaguiPressableScale>
          ))}
        </ScrollView>
      </View>

      {/* Floating stats (trust) - Glass Premium */}
      <View style={styles.statsCardWrapper}>
        <TamaguiGlassCard intensity="light" blurIntensity={50} padding="md">
          <View style={styles.statsHeader}>
            <TamaguiText preset="body" textColor="primary" weight="bold" style={styles.statsTitle}>
              {COPY.MAP_PLACES_NEARBY(stats.nearbyCount)}
            </TamaguiText>
            {stats.blockCount > 0 && (
              <ConfidenceBadge confidence={stats.overallConfidence} size="sm" />
            )}
          </View>
          <TamaguiText
            preset="caption"
            textColor="secondary"
            weight="semibold"
            style={styles.statsSub}
          >
            {stats.blockCount > 0
              ? COPY.DATA_BLOCKS_STAT(stats.blockCount, stats.overallConfidence, stats.sourceCount)
              : COPY.DATA_BLOCKS_EMPTY}
          </TamaguiText>
          <TamaguiText preset="caption" textColor="tertiary" style={styles.statsHint}>
            {COPY.COPARENTING_STAT(stats.coParenting)}
            {stats.filterCategory ? ` · ${stats.filterCategory}` : ''}
          </TamaguiText>
        </TamaguiGlassCard>
      </View>

      {visiblePlaces.length === 0 && (
        <View style={styles.emptyCard}>
          <TamaguiEmptyState
            icon="map-outline"
            title={COPY.NO_FILTER_MATCH}
            message={COPY.TRY_OTHER_FILTER}
            action={{
              label: COPY.RESET_FILTER,
              onPress: () => setActiveLayer('all'),
            }}
          />
        </View>
      )}

      {/* My location button (text-first) */}
      <TamaguiPressableScale
        onPress={handleMyLocationPress}
        hapticType="light"
        style={styles.locationButton}
        accessibilityLabel="현재 위치로 이동"
      >
        <TamaguiText preset="caption" textColor="inverse" weight="bold" style={styles.locationText}>
          locate
        </TamaguiText>
      </TamaguiPressableScale>

      {/* Bottom Sheet */}
      <ThreeSnapBottomSheet ref={bottomSheetRef} insightsMap={insightsMap} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  searchBar: {
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  searchText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  searchHint: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    opacity: 0.8,
  },
  layerChips: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  chipActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  chipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  chipBadgeMuted: {
    backgroundColor: Colors.backgroundSecondary,
  },
  chipBadgeActive: {
    backgroundColor: Colors.white,
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  statsCardWrapper: {
    position: 'absolute',
    top: 132,
    left: 16,
    right: 16,
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
    color: Colors.text,
    letterSpacing: -0.2,
  },
  statsSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  statsHint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    backgroundColor: Colors.text,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Shadows.card,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  emptyCard: {
    position: 'absolute',
    top: 220,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    ...Shadows.card,
  },
});
