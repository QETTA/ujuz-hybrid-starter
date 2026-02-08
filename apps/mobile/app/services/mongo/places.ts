/**
 * Places Service - Mongo API
 *
 * Mirrors the Supabase service interface but fetches from Mongo-backed API.
 * Falls back to mock data when offline or API is unavailable.
 */

import { apiGet, getApiBaseUrl, isOnline } from './client';
import type { PlaceWithDistance } from '@/app/types/places';
import { MOCK_NEARBY_PLACES } from '@/app/data/mocks';

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
  source: 'mongo' | 'mock' | 'cache';
}

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
  return Math.round(R * c);
}

function normalizePlace(row: any, userLat?: number, userLng?: number): PlaceWithDistance {
  const latitude =
    typeof row.latitude === 'number'
      ? row.latitude
      : typeof row.lat === 'number'
        ? row.lat
        : (row.location?.lat ?? 0);
  const longitude =
    typeof row.longitude === 'number'
      ? row.longitude
      : typeof row.lng === 'number'
        ? row.lng
        : (row.location?.lng ?? 0);

  const distance =
    userLat && userLng && latitude && longitude
      ? calculateDistance(userLat, userLng, latitude, longitude)
      : (row.distanceMeters ?? row.distance_meters ?? row.distance ?? undefined);

  return {
    id: row.id || row._id || row.place_id,
    source: (row.source || 'TOUR_API') as PlaceWithDistance['source'],
    sourceUrl: row.source_url || row.sourceUrl || row.website_url || '',
    fetchedAt: row.updated_at || row.fetched_at || new Date().toISOString(),
    name: row.name || row.title || 'Unknown',
    category: row.category || row.type || 'kids_cafe',
    address: row.address || row.location?.address || '',
    tel: row.phone || row.tel || undefined,
    latitude,
    longitude,
    rating:
      typeof row.rating === 'number'
        ? row.rating
        : typeof row.popularity_score === 'number'
          ? row.popularity_score / 20
          : undefined,
    reviewCount: row.review_count ?? row.reviewCount ?? undefined,
    distance,
    operatingHours: row.operating_hours ? { weekday: row.operating_hours } : undefined,
    admissionFee: row.admission_fee
      ? { isFree: row.admission_fee.includes('무료'), description: row.admission_fee }
      : { isFree: true },
    recommendedAges: row.recommended_ages ?? ['toddler', 'child'],
    amenities: {
      parking: row.parking_easy || row.parking_free || row.amenities?.parking || false,
      strollerAccess: row.stroller_friendly || row.amenities?.strollerAccess || false,
      nursingRoom: row.nursing_room || row.amenities?.nursingRoom || false,
      restaurant: row.restaurant_nearby || row.amenities?.restaurant || false,
    },
    imageUrl: row.image_url || row.imageUrl || undefined,
    thumbnailUrl: row.image_url || row.thumbnailUrl || undefined,
    rawData: row.rawData || {},
  };
}

async function fallbackNearby(offset = 0, limit = 50): Promise<PlacesQueryResult> {
  return {
    places: MOCK_NEARBY_PLACES.slice(offset, offset + limit),
    total: MOCK_NEARBY_PLACES.length,
    hasMore: offset + limit < MOCK_NEARBY_PLACES.length,
    source: 'mock',
  };
}

export const placesService = {
  async searchNearby(params: PlacesQueryParams): Promise<PlacesQueryResult> {
    const { lat, lng, radius = 5000, categories, limit = 50, offset = 0 } = params;

    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return fallbackNearby(offset, limit);
    }

    try {
      const result = await apiGet<any>('/places/nearby', {
        lat,
        lng,
        radius,
        categories,
        limit,
        offset,
      });

      const rows = Array.isArray(result) ? result : result.places || [];
      const total = result.total ?? rows.length;
      const places = rows.map((row: any) => normalizePlace(row, lat, lng));

      return {
        places,
        total,
        hasMore: offset + limit < total,
        source: 'mongo',
      };
    } catch (error) {
      console.warn('[MongoPlaces] searchNearby failed, fallback to mock:', error);
      return fallbackNearby(offset, limit);
    }
  },

  async getById(id: string): Promise<PlaceWithDistance | null> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return MOCK_NEARBY_PLACES.find((p) => p.id === id) || null;
    }

    try {
      const result = await apiGet<any>(`/places/${id}`);
      if (!result) return null;
      return normalizePlace(result);
    } catch (error) {
      console.warn('[MongoPlaces] getById failed:', error);
      return MOCK_NEARBY_PLACES.find((p) => p.id === id) || null;
    }
  },

  async searchByText(query: string, limit = 20): Promise<PlaceWithDistance[]> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return MOCK_NEARBY_PLACES.filter(
        (p) => p.name.includes(query) || p.address?.includes(query)
      ).slice(0, limit);
    }

    try {
      const result = await apiGet<any>('/places/search', { q: query, limit });
      const rows = Array.isArray(result) ? result : result.places || [];
      return rows.map((row: any) => normalizePlace(row));
    } catch (error) {
      console.warn('[MongoPlaces] searchByText failed:', error);
      return MOCK_NEARBY_PLACES.filter(
        (p) => p.name.includes(query) || p.address?.includes(query)
      ).slice(0, limit);
    }
  },

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
