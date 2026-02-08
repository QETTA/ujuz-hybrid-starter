/**
 * FilterStore Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import { useFilterStore } from '../filterStore';
import type { PlaceCategory, AgeGroup } from '@/app/types/places';

describe('useFilterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useFilterStore.getState().reset();
    });
  });

  describe('Quick Filter Category', () => {
    it('should set filter category', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setFilterCategory('outdoor');
      });

      expect(result.current.filterCategory).toBe('outdoor');
    });

    it('should reset to quick filter with appropriate place categories', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.resetToQuickFilter('indoor');
      });

      expect(result.current.filterCategory).toBe('indoor');
      expect(result.current.placeCategories).toEqual(['kids_cafe', 'museum']);
    });
  });

  describe('Place Categories', () => {
    it('should set place categories', () => {
      const { result } = renderHook(() => useFilterStore());
      const categories: PlaceCategory[] = ['kids_cafe', 'amusement_park'];

      act(() => {
        result.current.setPlaceCategories(categories);
      });

      expect(result.current.placeCategories).toEqual(categories);
    });

    it('should toggle place category', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.togglePlaceCategory('kids_cafe');
      });
      expect(result.current.placeCategories).toContain('kids_cafe');

      act(() => {
        result.current.togglePlaceCategory('kids_cafe');
      });
      expect(result.current.placeCategories).not.toContain('kids_cafe');
    });
  });

  describe('Age Groups', () => {
    it('should set age groups', () => {
      const { result } = renderHook(() => useFilterStore());
      const ages: AgeGroup[] = ['toddler', 'child'];

      act(() => {
        result.current.setAgeGroups(ages);
      });

      expect(result.current.ageGroups).toEqual(ages);
    });

    it('should toggle age group', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.toggleAgeGroup('toddler');
      });
      expect(result.current.ageGroups).toContain('toddler');

      act(() => {
        result.current.toggleAgeGroup('toddler');
      });
      expect(result.current.ageGroups).not.toContain('toddler');
    });
  });

  describe('Distance', () => {
    it('should set max distance', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setMaxDistance(5000);
      });

      expect(result.current.maxDistance).toBe(5000);
    });

    it('should clear max distance', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setMaxDistance(5000);
        result.current.setMaxDistance(null);
      });

      expect(result.current.maxDistance).toBeNull();
    });
  });

  describe('Price Range', () => {
    it('should set price range', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setPriceRange(0, 20000);
      });

      expect(result.current.priceRange.min).toBe(0);
      expect(result.current.priceRange.max).toBe(20000);
    });

    it('should clear price range', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setPriceRange(0, 20000);
        result.current.setPriceRange(null, null);
      });

      expect(result.current.priceRange.min).toBeNull();
      expect(result.current.priceRange.max).toBeNull();
    });
  });

  describe('Amenities', () => {
    it('should set amenity', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setAmenity('parking', true);
      });

      expect(result.current.amenities.parking).toBe(true);
    });

    it('should unset amenity', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setAmenity('parking', true);
        result.current.setAmenity('parking', false);
      });

      expect(result.current.amenities.parking).toBe(false);
    });
  });

  describe('Restaurant Filters', () => {
    it('should set restaurant filter', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setRestaurantFilter('hasPlayroom', true);
      });

      expect(result.current.restaurant.hasPlayroom).toBe(true);
    });
  });

  describe('Sort', () => {
    it('should set sort by', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setSortBy('rating');
      });

      expect(result.current.sortBy).toBe('rating');
    });
  });

  describe('Open Now', () => {
    it('should set open now filter', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setOpenNow(true);
      });

      expect(result.current.openNow).toBe(true);
    });
  });

  describe('Derived State', () => {
    it('should check if filtered', () => {
      const { result } = renderHook(() => useFilterStore());

      expect(result.current.isFiltered()).toBe(false);

      act(() => {
        result.current.setFilterCategory('outdoor');
      });

      expect(result.current.isFiltered()).toBe(true);
    });

    it('should count active filters', () => {
      const { result } = renderHook(() => useFilterStore());

      expect(result.current.getActiveFilterCount()).toBe(0);

      act(() => {
        result.current.setFilterCategory('outdoor'); // +2 (filter category + place categories)
        result.current.setMaxDistance(5000); // +1
        result.current.setAmenity('parking', true); // +1
      });

      // outdoor filter sets both filterCategory AND placeCategories
      expect(result.current.getActiveFilterCount()).toBe(4);
    });
  });

  describe('Reset', () => {
    it('should reset all filters', () => {
      const { result } = renderHook(() => useFilterStore());

      act(() => {
        result.current.setFilterCategory('outdoor');
        result.current.setMaxDistance(5000);
        result.current.setAmenity('parking', true);
        result.current.reset();
      });

      expect(result.current.filterCategory).toBeNull();
      expect(result.current.maxDistance).toBeNull();
      expect(result.current.amenities).toEqual({});
      expect(result.current.isFiltered()).toBe(false);
    });
  });
});
