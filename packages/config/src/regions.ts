/**
 * UJUz - Region Configuration (SSOT)
 *
 * All region definitions in one place. The engine, snapshotWorker,
 * block-builder, and API all reference this config.
 */

export type RegionKey =
  | 'wirye'
  | 'bundang'
  | 'gangnam'
  | 'seocho'
  | 'songpa'
  | 'seongnam'
  | 'default';

export interface RegionDef {
  key: RegionKey;
  /** Korean display name (used in user-facing evidence cards) */
  label: string;
  /** Address keywords - first match wins, so order within a region doesn't matter.
   *  Cross-region priority is handled by REGION_PRIORITY order. */
  keywords: string[];
  /** Optional bounding box [minLng, minLat, maxLng, maxLat] for coordinate-based fallback */
  bbox?: [number, number, number, number];
}

/**
 * Regions ordered by match priority (narrowest first).
 * "wirye" must come before "seongnam" because wirye addresses contain both.
 */
export const REGION_DEFS: RegionDef[] = [
  {
    key: 'wirye',
    label: '\uc704\ub840',
    keywords: ['\uc704\ub840'],
    bbox: [127.125, 37.465, 127.155, 37.495],
  },
  {
    key: 'bundang',
    label: '\ubd84\ub2f9\uad6c',
    keywords: ['\ubd84\ub2f9\uad6c', '\ubd84\ub2f9'],
  },
  {
    key: 'gangnam',
    label: '\uac15\ub0a8\uad6c',
    keywords: ['\uac15\ub0a8\uad6c'],
  },
  {
    key: 'seocho',
    label: '\uc11c\ucd08\uad6c',
    keywords: ['\uc11c\ucd08\uad6c'],
  },
  {
    key: 'songpa',
    label: '\uc1a1\ud30c\uad6c',
    keywords: ['\uc1a1\ud30c\uad6c'],
  },
  {
    key: 'seongnam',
    label: '\uc131\ub0a8\uc2dc',
    keywords: ['\uc131\ub0a8\uc2dc', '\uc131\ub0a8'],
  },
];

/** Quick lookup from RegionKey -> RegionDef */
export const REGION_MAP = new Map<RegionKey, RegionDef>(
  REGION_DEFS.map((r) => [r.key, r])
);

/** Get Korean display label for a region key */
export function regionLabel(key: RegionKey): string {
  return REGION_MAP.get(key)?.label ?? key;
}
