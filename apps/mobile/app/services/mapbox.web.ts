/**
 * Mapbox bootstrap (web)
 *
 * @rnmapbox/maps does not fully support Expo Web builds.
 * We provide a no-op implementation to keep the bundle safe.
 */

export function bootstrapMapbox(): { ok: boolean; reason?: string } {
  return { ok: false, reason: 'Mapbox is disabled on web' };
}

export function getMapboxStyleURL(): string {
  return '';
}
