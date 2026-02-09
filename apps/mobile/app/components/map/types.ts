/**
 * Map Component Shared Types
 * 모든 지도 컴포넌트(NaverMapView, Fallback)가 공유하는 타입
 */

export type MapLngLat = { lng: number; lat: number };

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

export type MapViewProps = {
  center: MapLngLat;
  zoom: number;
  layers: MapboxLayers;
  showUserLocation?: boolean;
  activeLayer?: 'all' | 'peers' | 'deals' | 'saved';
  onPlacePress?: (placeId: string) => void;
  onRegionDidChange?: (next: { center: MapLngLat; zoom: number }) => void;
};
