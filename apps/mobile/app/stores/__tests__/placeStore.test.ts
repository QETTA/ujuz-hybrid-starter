/**
 * PlaceStore Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import { usePlaceStore } from '../placeStore';
import type { PlaceWithDistance } from '@/app/types/places';

// Mock place data
const mockPlace: PlaceWithDistance = {
  id: 'test-place-1',
  source: 'TOUR_API',
  sourceUrl: 'https://api.visitkorea.or.kr/',
  fetchedAt: new Date().toISOString(),
  name: 'Test Kids Cafe',
  category: 'kids_cafe',
  address: 'Seoul, Korea',
  latitude: 37.5665,
  longitude: 126.978,
  distance: 500,
  recommendedAges: ['toddler', 'child'],
  amenities: {
    parking: true,
    nursingRoom: true,
  },
  admissionFee: {
    isFree: false,
    child: 10000,
  },
  rawData: {},
};

describe('usePlaceStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      usePlaceStore.getState().reset();
    });
  });

  describe('Place Selection', () => {
    it('should select a place', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.selectPlace(mockPlace);
      });

      expect(result.current.selectedPlace).toEqual(mockPlace);
    });

    it('should close bottom sheet', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.selectPlace(mockPlace);
        result.current.closeBottomSheet();
      });

      expect(result.current.selectedPlace).toBeNull();
    });

    it('should add to recent visits when selecting a place', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.selectPlace(mockPlace);
      });

      expect(result.current.recentVisits.length).toBe(1);
      expect(result.current.recentVisits[0].placeId).toBe(mockPlace.id);
      expect(result.current.recentVisits[0].placeName).toBe(mockPlace.name);
    });
  });

  describe('Favorites', () => {
    it('should add a place to favorites', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.addFavorite(mockPlace.id, mockPlace);
      });

      expect(result.current.favorites).toContain(mockPlace.id);
      expect(result.current.favoritePlaces).toContainEqual(mockPlace);
    });

    it('should remove a place from favorites', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.addFavorite(mockPlace.id, mockPlace);
        result.current.removeFavorite(mockPlace.id);
      });

      expect(result.current.favorites).not.toContain(mockPlace.id);
      expect(result.current.favoritePlaces).not.toContainEqual(mockPlace);
    });

    it('should toggle favorite status', () => {
      const { result } = renderHook(() => usePlaceStore());

      // Add to favorites
      act(() => {
        result.current.toggleFavorite(mockPlace.id, mockPlace);
      });
      expect(result.current.isFavorite(mockPlace.id)).toBe(true);

      // Remove from favorites
      act(() => {
        result.current.toggleFavorite(mockPlace.id);
      });
      expect(result.current.isFavorite(mockPlace.id)).toBe(false);
    });

    it('should check if a place is favorite', () => {
      const { result } = renderHook(() => usePlaceStore());

      expect(result.current.isFavorite(mockPlace.id)).toBe(false);

      act(() => {
        result.current.addFavorite(mockPlace.id, mockPlace);
      });

      expect(result.current.isFavorite(mockPlace.id)).toBe(true);
    });
  });

  describe('Search', () => {
    it('should set search result', () => {
      const { result } = renderHook(() => usePlaceStore());
      const searchResult = {
        places: [mockPlace],
        totalCount: 1,
        hasMore: false,
        query: 'test',
        searchedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setSearchResult(searchResult);
      });

      expect(result.current.searchResult).toEqual(searchResult);
    });

    it('should clear search result', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.setSearchResult({
          places: [mockPlace],
          totalCount: 1,
          hasMore: false,
          searchedAt: new Date().toISOString(),
        });
        result.current.clearSearchResult();
      });

      expect(result.current.searchResult).toBeNull();
    });

    it('should set searching state', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.setSearching(true);
      });

      expect(result.current.isSearching).toBe(true);

      act(() => {
        result.current.setSearching(false);
      });

      expect(result.current.isSearching).toBe(false);
    });

    it('should set search error', () => {
      const { result } = renderHook(() => usePlaceStore());
      const error = 'Search failed';

      act(() => {
        result.current.setSearchError(error);
      });

      expect(result.current.searchError).toBe(error);
    });
  });

  describe('Recommendations', () => {
    it('should set AI recommendations', () => {
      const { result } = renderHook(() => usePlaceStore());
      const recommendations = [mockPlace];

      act(() => {
        result.current.setRecommendations(recommendations);
      });

      expect(result.current.recommendations).toEqual(recommendations);
    });

    it('should set loading recommendations state', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.setLoadingRecommendations(true);
      });

      expect(result.current.isLoadingRecommendations).toBe(true);
    });
  });

  describe('Recent Visits', () => {
    it('should add a recent visit', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.addRecentVisit(mockPlace.id, mockPlace.name);
      });

      expect(result.current.recentVisits.length).toBe(1);
      expect(result.current.recentVisits[0].placeId).toBe(mockPlace.id);
      expect(result.current.recentVisits[0].placeName).toBe(mockPlace.name);
    });

    it('should not duplicate recent visits', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.addRecentVisit(mockPlace.id, mockPlace.name);
        result.current.addRecentVisit(mockPlace.id, mockPlace.name);
      });

      expect(result.current.recentVisits.length).toBe(1);
    });

    it('should clear recent visits', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.addRecentVisit(mockPlace.id, mockPlace.name);
        result.current.clearRecentVisits();
      });

      expect(result.current.recentVisits.length).toBe(0);
    });

    it('should limit recent visits to 20', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.addRecentVisit(`place-${i}`, `Place ${i}`);
        }
      });

      expect(result.current.recentVisits.length).toBe(20);
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => usePlaceStore());

      act(() => {
        result.current.selectPlace(mockPlace);
        result.current.addFavorite(mockPlace.id, mockPlace);
        result.current.setSearching(true);
        result.current.reset();
      });

      expect(result.current.selectedPlace).toBeNull();
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchResult).toBeNull();
    });
  });
});
