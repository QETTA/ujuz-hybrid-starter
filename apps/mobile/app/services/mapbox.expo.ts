/**
 * Mapbox bootstrap (Expo Go fallback)
 *
 * Returns fallback responses when native Mapbox is not available
 */

export function bootstrapMapbox(): { ok: boolean; reason?: string } {
  return { ok: false, reason: 'Mapbox not available in Expo Go' };
}

export function getMapboxStyleURL(): string {
  return '';
}
