/**
 * Mapbox bootstrap (native-safe)
 *
 * Attempts to use @rnmapbox/maps if available,
 * otherwise falls back gracefully (for Expo Go compatibility)
 */

import { MAPBOX_PUBLIC_TOKEN, MAPBOX_STYLE_URL } from '@env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MapboxGL: any = null;
let bootstrapped = false;
let nativeAvailable = false;

// Try to load native module
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MapboxGL = require('@rnmapbox/maps').default;
  nativeAvailable = true;
} catch {
  // Native module not available (Expo Go)
  nativeAvailable = false;
}

export function bootstrapMapbox(): { ok: boolean; reason?: string } {
  if (!nativeAvailable) {
    return { ok: false, reason: 'Mapbox native module not available in Expo Go' };
  }

  if (bootstrapped) return { ok: true };

  try {
    if (!MAPBOX_PUBLIC_TOKEN || MAPBOX_PUBLIC_TOKEN.trim().length < 10) {
      return { ok: false, reason: 'MAPBOX_PUBLIC_TOKEN is missing' };
    }

    MapboxGL.setAccessToken(MAPBOX_PUBLIC_TOKEN);
    MapboxGL.setTelemetryEnabled(false);
    bootstrapped = true;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: message };
  }
}

export function getMapboxStyleURL(): string {
  const url = (MAPBOX_STYLE_URL ?? '').trim();
  return url.length > 0 ? url : 'mapbox://styles/mapbox/light-v11';
}

export function isNativeMapboxAvailable(): boolean {
  return nativeAvailable;
}
