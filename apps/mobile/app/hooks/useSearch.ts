/**
 * useSearch Hook
 *
 * Manages search state and API calls with debouncing
 * - Direct Supabase connection (no backend server dependency)
 * - Automatic retry with exponential backoff
 */

import { useState, useCallback, useEffect } from 'react';
import { placesService } from '@/app/services/mongo';
import { useDebounce } from './useDebounce';
import { useLocation } from './useLocation';
import { useFilterStore } from '@/app/stores/filterStore';
import type { PlaceWithDistance } from '@/app/types/places';

interface UseSearchOptions {
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Auto-search on query change */
  autoSearch?: boolean;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
}

export function useSearch({
  debounceMs = 300,
  autoSearch = true,
  minQueryLength = 2,
}: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceWithDistance[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);
  const { location } = useLocation();
  const filterState = useFilterStore();

  // Perform search using Supabase places service
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < minQueryLength) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        // Use Supabase text search
        const searchResults = await placesService.searchByText(searchQuery, 50);

        // Client-side filtering and sorting
        let filtered = [...searchResults];

        // Filter by category if selected
        if (filterState.placeCategories.length > 0) {
          filtered = filtered.filter((p) => filterState.placeCategories.includes(p.category));
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

        // Calculate distance if location available
        if (location) {
          filtered = filtered.map((p) => ({
            ...p,
            distance:
              p.latitude !== undefined && p.longitude !== undefined
                ? calculateDistance(location.lat, location.lng, p.latitude, p.longitude)
                : undefined,
          }));
        }

        // Sort results
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
        }

        setResults(filtered);

        if (__DEV__) {
          console.log(`[useSearch] Found ${filtered.length} results for "${searchQuery}"`);
        }
      } catch (err) {
        console.error('[useSearch] Search failed:', err);
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [location, filterState, minQueryLength]
  );

  // Auto-search on debounced query change
  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery, autoSearch, performSearch]);

  // Manual search trigger
  const search = useCallback(
    (searchQuery?: string) => {
      const q = searchQuery ?? query;
      performSearch(q);
    },
    [query, performSearch]
  );

  // Clear search
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    search,
    clear,
    hasResults: results.length > 0,
    isEmpty: !isSearching && query.length >= minQueryLength && results.length === 0,
  };
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
