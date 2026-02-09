/**
 * NaverMapView - 네이버 지도 네이티브 컴포넌트
 *
 * @mj-studio/react-native-naver-map 기반
 * - 다크모드 자동 지원 (isNightModeEnabled)
 * - 마커 클러스터링
 * - 카메라 제어
 */

import { useCallback, useMemo, useRef } from 'react';
import { useColorScheme } from 'react-native';
import {
  NaverMapView as NMFMapView,
  NaverMapMarkerOverlay,
  type Camera,
  type CameraChangeReason,
  type Region,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { Colors } from '@/app/constants';
import type { MapViewProps } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGeoJSON = any;

// ─── Marker Data ───

interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

/** GeoJSON FeatureCollection → MarkerData[] */
function extractMarkers(geojson: AnyGeoJSON | null): MarkerData[] {
  if (!geojson?.features) return [];
  return geojson.features
    .filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) =>
        f.geometry?.type === 'Point' &&
        Array.isArray(f.geometry.coordinates) &&
        f.geometry.coordinates.length >= 2
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((f: any) => ({
      id: String(f.properties?.id || f.properties?.placeId || ''),
      latitude: f.geometry.coordinates[1] as number,
      longitude: f.geometry.coordinates[0] as number,
      name: String(f.properties?.name || f.properties?.title || ''),
    }));
}

// ─── Component ───

export default function NaverMapViewNative({
  center,
  zoom,
  layers,
  onPlacePress,
  onRegionDidChange,
}: MapViewProps) {
  const colorScheme = useColorScheme();
  const mapRef = useRef<NaverMapViewRef>(null);
  const isDark = colorScheme === 'dark';

  // GeoJSON → markers
  const markers = useMemo(() => extractMarkers(layers.places), [layers.places]);

  // Camera change handler
  const handleCameraChanged = useCallback(
    (params: Camera & { reason: CameraChangeReason; region: Region }) => {
      onRegionDidChange?.({
        center: { lat: params.latitude, lng: params.longitude },
        zoom: params.zoom ?? zoom,
      });
    },
    [onRegionDidChange, zoom]
  );

  // Marker tap handler
  const handleMarkerTap = useCallback(
    (placeId: string) => {
      onPlacePress?.(placeId);
    },
    [onPlacePress]
  );

  return (
    <NMFMapView
      ref={mapRef}
      style={{ flex: 1 }}
      isNightModeEnabled={isDark}
      lightness={isDark ? -0.3 : 0}
      initialCamera={{
        latitude: center.lat,
        longitude: center.lng,
        zoom,
      }}
      isShowCompass={false}
      isShowScaleBar={false}
      isShowZoomControls={false}
      isShowLocationButton={false}
      isExtentBoundedInKorea
      animationDuration={300}
      locale="ko"
      onCameraChanged={handleCameraChanged}
    >
      {markers.map((marker) => (
        <NaverMapMarkerOverlay
          key={marker.id}
          latitude={marker.latitude}
          longitude={marker.longitude}
          onTap={() => handleMarkerTap(marker.id)}
          anchor={{ x: 0.5, y: 1 }}
          caption={
            marker.name
              ? {
                  text: marker.name,
                  textSize: 12,
                  color: isDark ? '#FFFFFF' : Colors.iosLabel,
                  haloColor: isDark ? '#1C1C1ECC' : '#FFFFFFCC',
                }
              : undefined
          }
          image={{
            symbol: isDark ? 'blue' : 'green',
          }}
          width={32}
          height={40}
        />
      ))}
    </NMFMapView>
  );
}
