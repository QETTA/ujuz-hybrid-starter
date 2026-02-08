/**
 * Native Map View (Expo Go Compatible)
 *
 * In Expo Go: Shows fallback placeholder UI
 * In Development Build: Would use @rnmapbox/maps (requires rebuild)
 *
 * To enable full Mapbox functionality:
 * npx expo run:android
 */
import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

export type MapLngLat = { lng: number; lat: number };

// GeoJSON Feature type for map layers (compatible with geojson library)
type GeoJSONFeature = {
  type: 'Feature';
  properties: Record<string, unknown> | null;
  geometry: { type: string; coordinates: number[] | number[][] };
};

type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGeoJSON = GeoJSONFeatureCollection | any;

export type MapboxLayers = {
  places: AnyGeoJSON | null;
  peers?: AnyGeoJSON | null;
  heat?: AnyGeoJSON | null;
  coParents?: AnyGeoJSON | null;
};

type Props = {
  center: MapLngLat;
  zoom: number;
  layers: MapboxLayers;
  showUserLocation?: boolean;
  activeLayer?: 'all' | 'peers' | 'deals' | 'saved';
  onPlacePress?: (placeId: string) => void;
  onRegionDidChange?: (next: { center: MapLngLat; zoom: number }) => void;
};

/**
 * Fallback map for Expo Go (no native Mapbox support)
 * Shows placeholder with place count and interactive list
 */
export default function MapboxMapView({
  center,
  layers,
  activeLayer = 'all',
  onPlacePress,
}: Props) {
  const placeCount = layers.places?.features?.length || 0;
  const peerCount = layers.peers?.features?.length || 0;
  const heatCount = layers.heat?.features?.length || 0;

  // Get places for preview (up to 10)
  const previewPlaces = (layers.places?.features || []).slice(0, 10);

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="map" size={28} color={Colors.iosSystemBlue} />
          <View style={styles.headerText}>
            <TamaguiText
              preset="body"
              textColor="primary"
              weight="semibold"
              style={styles.headerTitle}
            >
              UJUz
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary" style={styles.headerSubtitle}>
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </TamaguiText>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="location" size={14} color={Colors.iosSystemBlue} />
            <TamaguiText
              preset="caption"
              textColor="primary"
              weight="medium"
              style={styles.statText}
            >
              {placeCount} 장소
            </TamaguiText>
          </View>
          {peerCount > 0 && (
            <View style={styles.statBadge}>
              <Ionicons name="people" size={14} color={Colors.iosSystemOrange} />
              <TamaguiText
                preset="caption"
                textColor="primary"
                weight="medium"
                style={styles.statText}
              >
                {peerCount} 또래
              </TamaguiText>
            </View>
          )}
          {heatCount > 0 && (
            <View style={styles.statBadge}>
              <Ionicons name="flame" size={14} color={Colors.iosSystemRed} />
              <TamaguiText
                preset="caption"
                textColor="primary"
                weight="medium"
                style={styles.statText}
              >
                {heatCount} 핫스팟
              </TamaguiText>
            </View>
          )}
        </View>
      </View>

      {/* Filter indicator */}
      {activeLayer !== 'all' && (
        <View style={styles.filterBanner}>
          <Ionicons name="filter" size={14} color={Colors.iosSystemBlue} />
          <TamaguiText preset="caption" textColor="brand" weight="medium" style={styles.filterText}>
            필터:{' '}
            {activeLayer === 'peers' ? '또래 활동' : activeLayer === 'deals' ? '할인' : '저장됨'}
          </TamaguiText>
        </View>
      )}

      {/* Place List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {previewPlaces.length > 0 ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          previewPlaces.map((place: any, index: number) => {
            const props = place.properties || {};
            const id = props.id || props.placeId || `place-${index}`;
            const coords = place.geometry?.coordinates || [];

            return (
              <TamaguiPressableScale
                key={id}
                style={styles.placeCard}
                onPress={() => onPlacePress?.(id)}
                hapticType="light"
              >
                <View style={styles.placeIcon}>
                  <Ionicons
                    name={
                      props.category === 'cafe'
                        ? 'cafe'
                        : props.category === 'restaurant'
                          ? 'restaurant'
                          : 'location'
                    }
                    size={20}
                    color={Colors.iosSystemBlue}
                  />
                </View>
                <View style={styles.placeInfo}>
                  <TamaguiText
                    preset="body"
                    textColor="primary"
                    weight="medium"
                    style={styles.placeName}
                    numberOfLines={1}
                  >
                    {props.name || props.title || `장소 ${index + 1}`}
                  </TamaguiText>
                  <TamaguiText
                    preset="caption"
                    textColor="secondary"
                    style={styles.placeDetail}
                    numberOfLines={1}
                  >
                    {props.category ||
                      props.address ||
                      (coords.length >= 2
                        ? `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
                        : '')}
                  </TamaguiText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.iosTertiaryLabel} />
              </TamaguiPressableScale>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.iosTertiaryLabel} />
            <TamaguiText
              preset="body"
              textColor="primary"
              weight="semibold"
              style={styles.emptyTitle}
            >
              주변 장소 없음
            </TamaguiText>
            <TamaguiText preset="caption" textColor="secondary" style={styles.emptySubtitle}>
              이 지역에는 등록된 장소가 없습니다
            </TamaguiText>
          </View>
        )}
      </ScrollView>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.iosSecondaryLabel} />
        <TamaguiText preset="caption" textColor="secondary" style={styles.infoText}>
          Expo Go 모드 - 전체 지도는 Development Build에서 사용 가능
        </TamaguiText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.iosSecondaryBackground,
  },
  header: {
    backgroundColor: Colors.background,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.iosSeparator,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.iosLabel,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.iosSecondaryLabel,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.iosSecondaryBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.iosLabel,
    fontWeight: '500',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.iosSystemBlue + '15',
    paddingVertical: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    color: Colors.iosSystemBlue,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.iosSystemBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.iosLabel,
  },
  placeDetail: {
    fontSize: 13,
    color: Colors.iosSecondaryLabel,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.iosSecondaryLabel,
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.iosSeparator,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.iosSecondaryLabel,
  },
});
