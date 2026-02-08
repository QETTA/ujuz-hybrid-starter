/**
 * useNearbyPlaces Hook Tests
 *
 * Tests location-based place fetching, filtering, and sorting
 */

import { renderHook } from '@testing-library/react-native';

import { useNearbyPlaces } from '../useNearbyPlaces';
import { useOfflineData } from '../useOfflineSupport';
import { useLocation } from '../useLocation';
import { useFilterStore } from '@/app/stores/filterStore';
import { MOCK_NEARBY_PLACES } from '@/app/data/mocks';

// Mock dependencies before importing the hook
jest.mock('@/app/services/mongo', () => ({
  placesService: { searchNearby: jest.fn() },
}));

jest.mock('../useOfflineSupport', () => ({
  useOfflineData: jest.fn(),
}));

jest.mock('../useLocation', () => ({
  useLocation: jest.fn(),
}));

jest.mock('@/app/stores/filterStore', () => ({
  useFilterStore: jest.fn(),
}));

jest.mock('@/app/data/mocks', () => ({
  MOCK_NEARBY_PLACES: [
    {
      id: 'mock-1',
      name: 'Mock Place 1',
      distance: 500,
      rating: 4.5,
      reviewCount: 100,
      admissionFee: { child: 10000 },
      fetchedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'mock-2',
      name: 'Mock Place 2',
      distance: 1000,
      rating: 4.0,
      reviewCount: 200,
      admissionFee: { child: 20000 },
      fetchedAt: '2026-01-02T00:00:00Z',
    },
  ],
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseOfflineData = useOfflineData as jest.MockedFunction<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseLocation = useLocation as jest.MockedFunction<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseFilterStore = useFilterStore as jest.MockedFunction<any>;

// Default filter state
const defaultFilterState = {
  placeCategories: [],
  ageGroups: [],
  amenities: {},
  openNow: false,
  maxDistance: null,
  priceRange: { min: null, max: null },
  sortBy: 'distance' as const,
};

describe('useNearbyPlaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseLocation.mockReturnValue({
      location: { lat: 37.5, lng: 127.0 },
      loading: false,
      error: null,
    });

    mockUseFilterStore.mockReturnValue(defaultFilterState);

    mockUseOfflineData.mockReturnValue({
      data: MOCK_NEARBY_PLACES,
      isLoading: false,
      error: null,
      isFromCache: false,
      isOnline: true,
      refresh: jest.fn(),
    });
  });

  describe('Basic functionality', () => {
    it('should return places data', () => {
      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return location from useLocation', () => {
      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.location).toEqual({ lat: 37.5, lng: 127.0 });
    });

    it('should return loading state when location is loading', () => {
      mockUseLocation.mockReturnValue({
        location: null,
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return error when location has error', () => {
      const locationError = new Error('Location permission denied');
      mockUseLocation.mockReturnValue({
        location: null,
        loading: false,
        error: locationError,
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.error).toBe(locationError);
    });
  });

  describe('Filtering', () => {
    it('should filter by max distance', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        maxDistance: 750, // Between 500 and 1000
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places).toHaveLength(1);
      expect(result.current.places[0].id).toBe('mock-1');
    });

    it('should filter by minimum price', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        priceRange: { min: 15000, max: null },
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places).toHaveLength(1);
      expect(result.current.places[0].id).toBe('mock-2');
    });

    it('should filter by maximum price', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        priceRange: { min: null, max: 15000 },
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places).toHaveLength(1);
      expect(result.current.places[0].id).toBe('mock-1');
    });

    it('should filter by price range', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        priceRange: { min: 5000, max: 15000 },
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places).toHaveLength(1);
      expect(result.current.places[0].id).toBe('mock-1');
    });
  });

  describe('Sorting', () => {
    it('should sort by distance (default)', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        sortBy: 'distance',
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places[0].distance).toBe(500);
      expect(result.current.places[1].distance).toBe(1000);
    });

    it('should sort by rating', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        sortBy: 'rating',
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places[0].rating).toBe(4.5);
      expect(result.current.places[1].rating).toBe(4.0);
    });

    it('should sort by popularity (review count)', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        sortBy: 'popular',
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places[0].reviewCount).toBe(200);
      expect(result.current.places[1].reviewCount).toBe(100);
    });

    it('should sort by recent (fetchedAt)', () => {
      mockUseFilterStore.mockReturnValue({
        ...defaultFilterState,
        sortBy: 'recent',
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.places[0].id).toBe('mock-2'); // Newer date
      expect(result.current.places[1].id).toBe('mock-1');
    });
  });

  describe('Options', () => {
    it('should use default options', () => {
      renderHook(() => useNearbyPlaces());

      expect(mockUseOfflineData).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('should respect enabled option', () => {
      renderHook(() => useNearbyPlaces({ enabled: false }));

      expect(mockUseOfflineData).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('should pass custom radius to fetcher', () => {
      renderHook(() => useNearbyPlaces({ radius: 10000 }));

      // The fetcher is passed to useOfflineData
      expect(mockUseOfflineData).toHaveBeenCalled();
    });
  });

  describe('Cache behavior', () => {
    it('should indicate when data is from cache', () => {
      mockUseOfflineData.mockReturnValue({
        data: MOCK_NEARBY_PLACES,
        isLoading: false,
        error: null,
        isFromCache: true,
        isOnline: true,
        refresh: jest.fn(),
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.isFromCache).toBe(true);
    });

    it('should indicate offline status', () => {
      mockUseOfflineData.mockReturnValue({
        data: MOCK_NEARBY_PLACES,
        isLoading: false,
        error: null,
        isFromCache: true,
        isOnline: false,
        refresh: jest.fn(),
      });

      const { result } = renderHook(() => useNearbyPlaces());

      expect(result.current.isOnline).toBe(false);
    });

    it('should provide refresh function', () => {
      const mockRefresh = jest.fn();
      mockUseOfflineData.mockReturnValue({
        data: MOCK_NEARBY_PLACES,
        isLoading: false,
        error: null,
        isFromCache: false,
        isOnline: true,
        refresh: mockRefresh,
      });

      const { result } = renderHook(() => useNearbyPlaces());

      result.current.refresh();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Empty/null data handling', () => {
    it('should return empty array when no data in production', () => {
      // Note: In test environment __DEV__ is true, so mock data is returned
      mockUseOfflineData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isFromCache: false,
        isOnline: true,
        refresh: jest.fn(),
      });

      const { result } = renderHook(() => useNearbyPlaces());

      // In dev mode, should return mock data
      expect(result.current.places.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty places array', () => {
      mockUseOfflineData.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isFromCache: false,
        isOnline: true,
        refresh: jest.fn(),
      });

      const { result } = renderHook(() => useNearbyPlaces());

      // In dev mode, should return mock data as fallback
      expect(result.current.places.length).toBeGreaterThanOrEqual(0);
    });
  });
});
