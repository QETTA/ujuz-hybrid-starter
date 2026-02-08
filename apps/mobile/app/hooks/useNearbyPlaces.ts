/**
 * useNearbyPlaces Hook
 *
 * Fetches nearby places using location and filter state
 * - Direct Supabase connection (no backend server dependency)
 * - Automatic retry with exponential backoff
 * - Offline/error fallback to mock data
 */

import { useCallback, useMemo } from 'react';
import { placesService } from '@/app/services/mongo';
import { useOfflineData } from './useOfflineSupport';
import { useLocation } from './useLocation';
import { useFilterStore } from '@/app/stores/filterStore';
import { MOCK_NEARBY_PLACES } from '@/app/data/mocks';
import type { PlaceWithDistance } from '@/app/types/places';

interface UseNearbyPlacesOptions {
  /** Whether to auto-fetch on mount */
  enabled?: boolean;
  /** Radius in meters */
  radius?: number;
  /** Maximum number of results */
  limit?: number;
}

export function useNearbyPlaces({
  enabled = true,
  radius = 5000, // 5km default
  limit = 50,
}: UseNearbyPlacesOptions = {}) {
  const { location, loading: isLoadingLocation, error: locationError } = useLocation();
  const filterState = useFilterStore();

  // Fetch function using Supabase places service
  const fetcher = useCallback(async () => {
    // Build query params
    const params = {
      lat: location?.lat,
      lng: location?.lng,
      radius,
      categories: filterState.placeCategories.length > 0 ? filterState.placeCategories : undefined,
      limit,
    };

    // Use Supabase places service (handles retries and fallbacks internally)
    const result = await placesService.searchNearby(params);

    if (__DEV__) {
      console.log(`[useNearbyPlaces] Loaded ${result.places.length} places from ${result.source}`);
    }

    return result.places;
  }, [location, radius, limit, filterState.placeCategories]);

  // Use offline data hook for caching
  const {
    data: places,
    isLoading,
    error,
    isFromCache,
    isOnline,
    refresh,
  } = useOfflineData<PlaceWithDistance[]>({
    fetcher,
    cacheConfig: {
      key: `nearby-${location?.lat}-${location?.lng}`,
      ttl: 1000 * 60 * 10, // 10 minutes
      staleWhileRevalidate: true,
    },
    enabled: enabled && !isLoadingLocation,
  });

  // Use mock data as fallback only in development
  const placesWithFallback = useMemo(() => {
    if (!places || places.length === 0) {
      return __DEV__ ? MOCK_NEARBY_PLACES : [];
    }
    return places;
  }, [places]);

  // Filter and sort results client-side
  const filteredPlaces = useCallback(
    (placesData: PlaceWithDistance[]) => {
      let filtered = [...placesData];

      // Apply distance filter
      if (filterState.maxDistance && filtered.length > 0) {
        filtered = filtered.filter((p) => (p.distance ?? Infinity) <= filterState.maxDistance!);
      }

      // Apply price filter
      if (filterState.priceRange.min !== null || filterState.priceRange.max !== null) {
        filtered = filtered.filter((p) => {
          const price = p.admissionFee?.child ?? p.admissionFee?.adult ?? 0;
          const minMatch =
            filterState.priceRange.min === null || price >= filterState.priceRange.min;
          const maxMatch =
            filterState.priceRange.max === null || price <= filterState.priceRange.max;
          return minMatch && maxMatch;
        });
      }

      // Sort by selected option
      switch (filterState.sortBy) {
        case 'distance':
          filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
          break;
        case 'rating':
          filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          break;
        case 'popular':
          filtered.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
          break;
        case 'recent':
          // Sort by fetchedAt timestamp
          filtered.sort(
            (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
          );
          break;
      }

      return filtered;
    },
    [filterState]
  );

  const finalPlaces = filteredPlaces(placesWithFallback);

  return {
    places: finalPlaces,
    isLoading: isLoading || isLoadingLocation,
    error: error ?? locationError,
    isFromCache,
    isOnline,
    refresh,
    location,
  };
}
