/**
 * useMapLayers Hook
 *
 * Transforms places + activeLayer → filtered FeatureCollections for Mapbox rendering.
 * Encapsulates all layer filtering and GeoJSON conversion logic.
 */

import { useMemo } from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { PlaceWithDistance } from '@/app/types/places';
import type { PlaceInsights } from '@/app/types/dataBlock';
import { toFeatureCollection, toHeatFeatures, toPeerDots, getBlockValue } from '../utils/geojson';

export type MapLayerKey = 'all' | 'peers' | 'deals' | 'saved';

export interface MapLayerCollections {
  places: FeatureCollection<Point>;
  heat: FeatureCollection<Point>;
  peers: FeatureCollection<Point>;
}

export interface FilterCounts {
  savedCount: number;
  dealsCount: number;
  peersCount: number;
}

interface UseMapLayersParams {
  places: PlaceWithDistance[];
  activeLayer: MapLayerKey;
  favoritesSet: Set<string>;
  insightsMap: Map<string, PlaceInsights>;
}

export function useMapLayers({
  places,
  activeLayer,
  favoritesSet,
  insightsMap,
}: UseMapLayersParams) {
  const visiblePlaces = useMemo(() => {
    if (activeLayer === 'all') return places;
    if (activeLayer === 'saved') {
      return places.filter((place) => favoritesSet.has(place.id));
    }
    if (insightsMap.size === 0) return places;

    if (activeLayer === 'deals') {
      return places.filter((place) => getBlockValue(insightsMap.get(place.id)?.dealCount) > 0);
    }
    if (activeLayer === 'peers') {
      return places.filter((place) => getBlockValue(insightsMap.get(place.id)?.peerVisits) > 0);
    }

    return places;
  }, [activeLayer, favoritesSet, insightsMap, places]);

  const mapLayers: MapLayerCollections = useMemo(
    () => ({
      places: toFeatureCollection(visiblePlaces),
      heat: toHeatFeatures(visiblePlaces),
      peers: toPeerDots(visiblePlaces),
    }),
    [visiblePlaces]
  );

  const filterCounts: FilterCounts = useMemo(() => {
    const savedCount = places.filter((place) => favoritesSet.has(place.id)).length;
    const dealsCount = places.filter(
      (place) => getBlockValue(insightsMap.get(place.id)?.dealCount) > 0
    ).length;
    const peersCount = places.filter(
      (place) => getBlockValue(insightsMap.get(place.id)?.peerVisits) > 0
    ).length;
    return { savedCount, dealsCount, peersCount };
  }, [favoritesSet, insightsMap, places]);

  return { visiblePlaces, mapLayers, filterCounts };
}
