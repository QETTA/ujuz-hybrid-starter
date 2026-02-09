/**
 * MapScreen - Naver Map (다크모드 커스텀) + User Data Visualization
 *
 * 목표:
 * - 네이버 지도 SDK (@mj-studio/react-native-naver-map)
 * - uju UX 원칙: Map은 도구, 상단의 '인텔리전스/컨텍스트'가 중심
 * - peers / deals / saved 레이어를 최소 토글로 제공 (선택 피로 ↓)
 * - 다크모드 자동 전환 (isNightModeEnabled)
 *
 * Refactored:
 * - GeoJSON 변환 → map/utils/geojson.ts
 * - 레이어 필터링 → map/hooks/useMapLayers.ts
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'tamagui';

import { NaverMapView, ThreeSnapBottomSheet } from '@/app/components/map';
import { ConfidenceBadge } from '@/app/components/dataBlock';
import {
  TamaguiChip,
  TamaguiEmptyState,
  TamaguiGlassCard,
  TamaguiText,
  TamaguiPressableScale,
} from '@/app/design-system';
import { Shadows } from '@/app/constants';
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MapScreenNavigationProp>();

  const { filterCategory } = useFilterStore();
  const { center, zoom, setCenter, setZoom } = useMapStore();
  const { selectPlace, selectedPlace, favorites } = usePlaceStore();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>('all');
  const [sortMode, setSortMode] = useState<'default' | 'popular'>('default');
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const placeIds = useMemo(() => places.map((p) => p.id), [places]);
  const { insightsMap } = useInsights(placeIds);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    // TODO: replace with real API + data blocks
    // Seed fallback: if API returns 0, use first 5 mock places
    const data = MOCK_MAP_PLACES;
    setPlaces(data.length > 0 ? data : MOCK_MAP_PLACES.slice(0, 5));
  }, []);

  const { visiblePlaces: rawVisiblePlaces, mapLayers, filterCounts } = useMapLayers({
    places,
    activeLayer,
    favoritesSet,
    insightsMap,
  });

  const visiblePlaces = useMemo(() => {
    if (sortMode !== 'popular') return rawVisiblePlaces;
    return [...rawVisiblePlaces].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
  }, [rawVisiblePlaces, sortMode]);

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

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: theme.background.val,
      } as const,
      header: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
      },
      searchBar: {
        height: 48,
        backgroundColor: theme.card.val,
        borderRadius: 16,
        paddingHorizontal: 18,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        ...Shadows.card,
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
      },
      searchText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.textPrimary.val,
        letterSpacing: -0.2,
      },
      searchHint: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: theme.textTertiary.val,
        opacity: 0.8,
      },
      layerChips: {
        position: 'absolute' as const,
        top: 74,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
      },
      chipsContainer: {
        gap: 8,
        paddingRight: 16,
      },
      statsCardWrapper: {
        position: 'absolute' as const,
        top: 132,
        left: 16,
        right: 16,
      },
      statsHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginBottom: 6,
      },
      statsTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: theme.textPrimary.val,
        letterSpacing: -0.2,
      },
      statsSub: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: '600' as const,
        color: theme.textSecondary.val,
        letterSpacing: -0.2,
      },
      statsHint: {
        marginTop: 6,
        fontSize: 12,
        color: theme.textTertiary.val,
      },
      locationButton: {
        position: 'absolute' as const,
        right: 16,
        bottom: 160,
        backgroundColor: theme.textPrimary.val,
        borderRadius: 16,
        width: 48,
        height: 48,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        ...Shadows.card,
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      },
      emptyCard: {
        position: 'absolute' as const,
        top: 220,
        left: 16,
        right: 16,
        backgroundColor: theme.card.val,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center' as const,
        gap: 10,
        ...Shadows.card,
      },
      emptyCtas: {
        width: '100%' as const,
        gap: 8,
        marginTop: 4,
      },
      emptyCtaBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.surface.val,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      },
    }),
    [theme]
  );

  return (
    <View style={styles.container}>
      <NaverMapView
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
            시설 검색
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
            <TamaguiChip
              key={chip.key}
              label={chip.label}
              variant={activeLayer === chip.key ? 'filled' : 'outlined'}
              onPress={() => setActiveLayer(chip.key)}
            />
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
          />
          <View style={styles.emptyCtas}>
            <TamaguiPressableScale
              style={styles.emptyCtaBtn}
              hapticType="light"
              onPress={() => {
                setSortMode('popular');
                setActiveLayer('all');
              }}
              accessibilityLabel="인기순으로 보기"
            >
              <Ionicons name="trending-up" size={16} color={theme.textPrimary.val} />
              <TamaguiText preset="caption" textColor="primary" weight="semibold">
                인기순으로 보기
              </TamaguiText>
            </TamaguiPressableScale>
            <TamaguiPressableScale
              style={styles.emptyCtaBtn}
              hapticType="light"
              onPress={() => navigation.navigate('Ask')}
              accessibilityLabel="우주봇에게 추천받기"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.textPrimary.val} />
              <TamaguiText preset="caption" textColor="primary" weight="semibold">
                우주봇에게 추천받기
              </TamaguiText>
            </TamaguiPressableScale>
            <TamaguiPressableScale
              style={styles.emptyCtaBtn}
              hapticType="light"
              onPress={() => setActiveLayer('all')}
              accessibilityLabel={COPY.RESET_FILTER}
            >
              <Ionicons name="refresh" size={16} color={theme.textPrimary.val} />
              <TamaguiText preset="caption" textColor="primary" weight="semibold">
                {COPY.RESET_FILTER}
              </TamaguiText>
            </TamaguiPressableScale>
          </View>
        </View>
      )}

      {/* My location button (text-first) */}
      <TamaguiPressableScale
        onPress={handleMyLocationPress}
        hapticType="light"
        style={styles.locationButton}
        accessibilityLabel="현재 위치로 이동"
      >
        <Ionicons name="locate" size={20} color={theme.background.val} />
      </TamaguiPressableScale>

      {/* Bottom Sheet */}
      <ThreeSnapBottomSheet ref={bottomSheetRef} insightsMap={insightsMap} />
    </View>
  );
}
