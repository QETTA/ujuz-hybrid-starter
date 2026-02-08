/**
 * Places Service - Supabase Direct Access
 *
 * Provides robust place data access with:
 * - Direct Supabase queries (no backend dependency)
 * - Automatic retry with exponential backoff
 * - Offline/error fallback to mock data
 * - Distance calculation support
 */

import { getSupabaseClient, PlaceRow } from './client';
import type { PlaceWithDistance } from '@/app/types/places';
import { MOCK_NEARBY_PLACES } from '@/app/data/mocks';
import NetInfo from '@react-native-community/netinfo';

// Query parameters
export interface PlacesQueryParams {
  lat?: number;
  lng?: number;
  radius?: number; // meters
  categories?: string[];
  limit?: number;
  offset?: number;
}

// Query result
export interface PlacesQueryResult {
  places: PlaceWithDistance[];
  total: number;
  hasMore: boolean;
  source: 'supabase' | 'mock' | 'cache';
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 500, // ms
  maxDelay: 5000, // ms
};

// Calculate distance using Haversine formula
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
  return Math.round(R * c); // distance in meters
}

// Map Supabase row to app type
function mapRowToPlace(row: PlaceRow, userLat?: number, userLng?: number): PlaceWithDistance {
  const distance =
    userLat && userLng && row.latitude && row.longitude
      ? calculateDistance(userLat, userLng, row.latitude, row.longitude)
      : undefined;

  return {
    id: row.id,
    source: (row.source === 'PLAYGROUND_API'
      ? 'PLAYGROUND_API'
      : 'TOUR_API') as PlaceWithDistance['source'],
    sourceUrl: row.website_url || '',
    fetchedAt: row.updated_at || new Date().toISOString(),
    name: row.name,
    category: row.category as PlaceWithDistance['category'],
    address: row.address || '',
    tel: row.phone || undefined,
    latitude: row.latitude || 0,
    longitude: row.longitude || 0,
    rating: row.popularity_score ? row.popularity_score / 20 : undefined, // Convert 0-100 to 0-5
    reviewCount: undefined,
    distance,
    operatingHours: row.operating_hours ? { weekday: row.operating_hours } : undefined,
    admissionFee: row.admission_fee
      ? { isFree: row.admission_fee.includes('무료'), description: row.admission_fee }
      : { isFree: true },
    recommendedAges: (() => {
      const ages: PlaceWithDistance['recommendedAges'] = [];
      if (row.age_2_4 && row.age_2_4 >= 3) ages.push('toddler');
      if (row.age_5_7 && row.age_5_7 >= 3) ages.push('child');
      if (row.age_8_10 && row.age_8_10 >= 3) ages.push('elementary');
      return ages.length > 0 ? ages : ['toddler', 'child'];
    })(),
    amenities: {
      parking: row.parking_easy || row.parking_free || false,
      strollerAccess: row.stroller_friendly || false,
      nursingRoom: row.nursing_room || false,
      restaurant: row.restaurant_nearby || false,
    },
    imageUrl: row.image_url || undefined,
    thumbnailUrl: row.image_url || undefined,
    rawData: {},
  };
}

// Retry with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = RETRY_CONFIG.maxRetries): Promise<T> {
  let lastError: Error | undefined;
  let delay = RETRY_CONFIG.initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[PlacesService] Attempt ${attempt + 1} failed:`, error);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
      }
    }
  }

  throw lastError;
}

// Check network connectivity
async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return false;
  }
}

// Places service
export const placesService = {
  /**
   * Search for nearby places
   */
  async searchNearby(params: PlacesQueryParams): Promise<PlacesQueryResult> {
    const { lat, lng, radius = 5000, categories, limit = 50, offset = 0 } = params;

    // Check network first
    const online = await isOnline();
    if (!online) {
      console.log('[PlacesService] Offline, using mock data');
      return {
        places: MOCK_NEARBY_PLACES.slice(offset, offset + limit),
        total: MOCK_NEARBY_PLACES.length,
        hasMore: offset + limit < MOCK_NEARBY_PLACES.length,
        source: 'mock',
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[PlacesService] No Supabase client, using mock data');
      return {
        places: MOCK_NEARBY_PLACES.slice(offset, offset + limit),
        total: MOCK_NEARBY_PLACES.length,
        hasMore: offset + limit < MOCK_NEARBY_PLACES.length,
        source: 'mock',
      };
    }

    try {
      const result = await withRetry(async () => {
        // Build query
        let query = supabase
          .from('places')
          .select('*', { count: 'exact' })
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        // Category filter
        if (categories && categories.length > 0) {
          query = query.in('category', categories);
        }

        // Execute query
        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Supabase query failed: ${error.message}`);
        }

        return { data: data || [], count: count || 0 };
      });

      // Map and filter by distance
      let places = result.data.map((row) => mapRowToPlace(row, lat, lng));

      // Filter by radius if location provided
      if (lat && lng && radius) {
        places = places.filter((p) => (p.distance ?? Infinity) <= radius);
      }

      // Sort by distance
      places.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      console.log(`[PlacesService] Found ${places.length} places from Supabase`);

      // If no results from Supabase, fall back to mock data (especially in dev)
      if (places.length === 0) {
        console.log('[PlacesService] No places found in Supabase, using mock data');
        return {
          places: MOCK_NEARBY_PLACES.slice(offset, offset + limit),
          total: MOCK_NEARBY_PLACES.length,
          hasMore: offset + limit < MOCK_NEARBY_PLACES.length,
          source: 'mock',
        };
      }

      return {
        places,
        total: result.count,
        hasMore: offset + limit < result.count,
        source: 'supabase',
      };
    } catch (error) {
      console.error('[PlacesService] All retries failed, using mock data:', error);
      return {
        places: MOCK_NEARBY_PLACES.slice(offset, offset + limit),
        total: MOCK_NEARBY_PLACES.length,
        hasMore: offset + limit < MOCK_NEARBY_PLACES.length,
        source: 'mock',
      };
    }
  },

  /**
   * Get place by ID
   */
  async getById(id: string): Promise<PlaceWithDistance | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return MOCK_NEARBY_PLACES.find((p) => p.id === id) || null;
    }

    try {
      const { data, error } = await withRetry(async () => {
        return supabase.from('places').select('*').eq('id', id).single();
      });

      if (error || !data) {
        console.warn('[PlacesService] Place not found:', id);
        return MOCK_NEARBY_PLACES.find((p) => p.id === id) || null;
      }

      return mapRowToPlace(data);
    } catch (error) {
      console.error('[PlacesService] getById failed:', error);
      return MOCK_NEARBY_PLACES.find((p) => p.id === id) || null;
    }
  },

  /**
   * Search places by text query
   */
  async searchByText(query: string, limit = 20): Promise<PlaceWithDistance[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return MOCK_NEARBY_PLACES.filter(
        (p) => p.name.includes(query) || p.address?.includes(query)
      ).slice(0, limit);
    }

    try {
      const { data, error } = await withRetry(async () => {
        return supabase
          .from('places')
          .select('*')
          .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
          .limit(limit);
      });

      if (error || !data) {
        return MOCK_NEARBY_PLACES.filter(
          (p) => p.name.includes(query) || p.address?.includes(query)
        ).slice(0, limit);
      }

      return data.map((row) => mapRowToPlace(row));
    } catch (error) {
      console.error('[PlacesService] searchByText failed:', error);
      return MOCK_NEARBY_PLACES.filter(
        (p) => p.name.includes(query) || p.address?.includes(query)
      ).slice(0, limit);
    }
  },

  /**
   * Get places by category
   */
  async getByCategory(
    category: string,
    lat?: number,
    lng?: number,
    limit = 20
  ): Promise<PlaceWithDistance[]> {
    return (
      await this.searchNearby({
        lat,
        lng,
        categories: [category],
        limit,
      })
    ).places;
  },
};

export default placesService;
