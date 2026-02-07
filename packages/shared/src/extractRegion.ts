/**
 * UJUz - Region Extraction Utility (shared)
 *
 * Single source of truth for address -> RegionKey resolution.
 * Used by admissionEngineV1, snapshotWorker, block-builder, and API.
 *
 * Resolution order:
 *  1. Keyword match against address (priority-ordered: narrowest region first)
 *  2. Bounding box check against lat/lng (fallback when address is ambiguous)
 *  3. null if no match
 */

import { REGION_DEFS, type RegionKey } from '@ujuz/config';

export interface RegionInput {
  address?: string;
  lat?: number;
  lng?: number;
}

/**
 * Extract region from address and/or coordinates.
 *
 * @returns RegionKey or null if no region matched.
 */
export function extractRegion(input: RegionInput): RegionKey | null {
  const { address, lat, lng } = input;

  // 1. Keyword match (priority order from REGION_DEFS)
  if (address) {
    for (const def of REGION_DEFS) {
      for (const kw of def.keywords) {
        if (address.includes(kw)) {
          return def.key;
        }
      }
    }
  }

  // 2. Bounding box fallback (when address didn't match but coords available)
  if (typeof lat === 'number' && typeof lng === 'number') {
    for (const def of REGION_DEFS) {
      if (!def.bbox) continue;
      const [minLng, minLat, maxLng, maxLat] = def.bbox;
      if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
        return def.key;
      }
    }
  }

  return null;
}

/**
 * Convenience overload: extract from address string only.
 * Backwards-compatible with the old inline extractRegion(address) calls.
 */
export function extractRegionFromAddress(address: string | undefined): RegionKey | null {
  if (!address) return null;
  return extractRegion({ address });
}
