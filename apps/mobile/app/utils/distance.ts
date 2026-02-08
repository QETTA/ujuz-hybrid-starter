/**
 * Distance calculation utilities using Haversine formula
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param from - Starting coordinates
 * @param to - Ending coordinates
 * @returns Distance in meters
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.2km", "350m")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Sort places by distance from a reference point
 */
export function sortByDistance<T extends { latitude?: number; longitude?: number }>(
  places: T[],
  from: Coordinates
): (T & { distance: number })[] {
  return places
    .map((place) => {
      const distance =
        place.latitude && place.longitude
          ? calculateDistance(from, { lat: place.latitude, lng: place.longitude })
          : Infinity;
      return { ...place, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}
