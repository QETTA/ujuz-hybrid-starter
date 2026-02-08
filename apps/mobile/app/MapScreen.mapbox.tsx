/**
 * MapScreen - Mapbox First (Toss-minimal) + User Data Visualization
 *
 * 목표:
 * - Kakao WebView 기반 지도 → Mapbox Native SDK로 전환
 * - uju UX 원칙: Map은 도구, 상단의 '인텔리전스/컨텍스트'가 중심
 * - peers / deals / saved 레이어를 최소 토글로 제공 (선택 피로 ↓)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

import { MapboxMapView, ThreeSnapBottomSheet } from '@/app/components/map';
import { Colors, Shadows } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { MOCK_MAP_PLACES } from '@/app/data/mocks';
import { useFilterStore } from '@/app/stores/filterStore';
import { useMapStore } from '@/app/stores/mapStore';
import { usePlaceStore } from '@/app/stores/placeStore';
import type { MapScreenNavigationProp } from '@/app/types/navigation';
import type { PlaceWithDistance } from '@/app/types/places';

import type { FeatureCollection, Point } from 'geojson';

// ============================================
// Design Tokens (Toss Style → Colors 토큰)
// ============================================
const C = {
  text: {
    primary: Colors.tossGray800,
    secondary: Colors.tossGray600,
    tertiary: Colors.iosTertiaryLabel,
    inverse: Colors.white,
  },
  bg: {
    primary: Colors.white,
    secondary: Colors.tossGray50,
    glass: Colors.glassLight,
  },
  brand: {
    primary: Colors.primary,
  },
  status: {
    live: Colors.iosSystemRed,
    success: Colors.successMint,
  },
};

// ============================================
// Helpers (deterministic jitter for peer dots)
// ============================================

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function jitterLngLat(
  lng: number,
  lat: number,
  meters: number,
  seed: number
): { lng: number; lat: number } {
  // ~111,320m per degree latitude. Longitude scales by cos(lat).
  const r = (seed % 1000) / 1000; // 0..1
  const angle = ((seed % 360) * Math.PI) / 180;
  const dist = meters * (0.35 + 0.65 * r);

  const dLat = (dist * Math.sin(angle)) / 111320;
  const dLng = (dist * Math.cos(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

  return { lng: lng + dLng, lat: lat + dLat };
}

function toFeatureCollection(places: PlaceWithDistance[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: places
      .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude!, p.latitude!] },
        properties: { id: p.id, name: p.name },
      })),
  };
}

function toHeatFeatures(places: PlaceWithDistance[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: places
      .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map((p) => {
        const seed = hashSeed(p.id);
        // pseudo "deal/interest" score 0..1 (temporary, later replace with data blocks)
        const score = Math.min(1, 0.2 + ((seed % 100) / 100) * 0.8);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.longitude!, p.latitude!] },
          properties: { id: p.id, weight: score },
        };
      }),
  };
}

function toPeerDots(places: PlaceWithDistance[]): FeatureCollection<Point> {
  const features: any[] = [];
  places.forEach((p) => {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return;
    const base = hashSeed(p.id);
    const dots = 4 + (base % 7); // 4..10
    for (let i = 0; i < dots; i += 1) {
      const seed = base + i * 97;
      const j = jitterLngLat(p.longitude!, p.latitude!, 240, seed);
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [j.lng, j.lat] },
        properties: { placeId: p.id },
      });
    }
  });
  return { type: 'FeatureCollection', features };
}

// ============================================
// Main Screen
// ============================================

export default function MapScreenMapbox() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MapScreenNavigationProp>();

  const { filterCategory } = useFilterStore();
  const { center, zoom, setCenter, setZoom } = useMapStore();
  const { selectPlace } = usePlaceStore();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'peers' | 'deals' | 'saved'>('all');
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);

  useEffect(() => {
    // TODO: replace with real API + data blocks
    setPlaces(MOCK_MAP_PLACES);
  }, []);

  const mapLayers = useMemo(() => {
    const base = toFeatureCollection(places);
    const heat = toHeatFeatures(places);
    const peers = toPeerDots(places);

    return { places: base, heat, peers };
  }, [places]);

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
    () =>
      [
        { key: 'all', label: 'peers · deals · saved' },
        { key: 'peers', label: 'peers' },
        { key: 'deals', label: 'deals' },
        { key: 'saved', label: 'saved' },
      ] as const,
    []
  );

  const stats = useMemo(() => {
    const nearbyCount = places.length;
    const coParenting = 5 + (hashSeed('co') % 8); // temporary stub
    return { nearbyCount, coParenting, filterCategory };
  }, [places, filterCategory]);

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
        >
          <TamaguiText
            preset="body"
            textColor="primary"
            weight="semibold"
            style={styles.searchText}
          >
            Search places
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
            >
              <TamaguiText
                preset="caption"
                textColor={activeLayer === chip.key ? 'inverse' : 'secondary'}
                weight="semibold"
                style={styles.chipText}
              >
                {chip.label}
              </TamaguiText>
            </TamaguiPressableScale>
          ))}
        </ScrollView>
      </View>

      {/* Floating stats (trust-ish, minimal) */}
      <View style={styles.statsCard}>
        <TamaguiText preset="body" textColor="primary" weight="bold" style={styles.statsTitle}>
          {stats.nearbyCount} places nearby
        </TamaguiText>
        <TamaguiText
          preset="caption"
          textColor="secondary"
          weight="semibold"
          style={styles.statsSub}
        >
          {stats.coParenting} co-parenting clusters
          {stats.filterCategory ? ` · ${stats.filterCategory}` : ''}
        </TamaguiText>
      </View>

      {/* My location button (text-first) */}
      <TamaguiPressableScale
        onPress={handleMyLocationPress}
        hapticType="light"
        style={styles.locationButton}
      >
        <TamaguiText preset="caption" textColor="inverse" weight="bold" style={styles.locationText}>
          locate
        </TamaguiText>
      </TamaguiPressableScale>

      {/* Bottom Sheet */}
      <ThreeSnapBottomSheet ref={bottomSheetRef} />

      {/* Recommendation strip (optional) */}
      {/* Keep it subtle: map is not the center, recommendation is */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg.primary,
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
    backgroundColor: C.bg.glass,
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
    color: C.text.primary,
    letterSpacing: -0.2,
  },

  searchHint: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text.tertiary,
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
    backgroundColor: C.text.primary,
    borderColor: C.text.primary,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text.secondary,
    letterSpacing: -0.2,
  },

  chipTextActive: {
    color: C.text.inverse,
  },

  statsCard: {
    position: 'absolute',
    top: 132,
    left: 16,
    right: 16,
    backgroundColor: C.bg.glass,
    borderRadius: 16,
    padding: 14,
    ...Shadows.card,
  },

  statsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text.primary,
    letterSpacing: -0.2,
  },

  statsSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: C.text.secondary,
    letterSpacing: -0.2,
  },

  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    backgroundColor: C.text.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Shadows.card,
  },

  locationText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text.inverse,
    letterSpacing: -0.2,
  },
});
