/**
 * GeoJSON Transformation Utilities
 *
 * Pure functions for converting PlaceWithDistance[] → GeoJSON FeatureCollections.
 * Extracted from MapScreen.mapbox.tsx for reuse and testability.
 */

import type { FeatureCollection, Point } from 'geojson';
import type { PlaceWithDistance } from '@/app/types/places';
import type { DataBlock } from '@/app/types/dataBlock';

// ─── Deterministic Jitter (peer dot clustering) ───

/** FNV-1a hash for deterministic seed generation */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Apply deterministic spatial jitter to coordinates (meters-based offset) */
export function jitterLngLat(
  lng: number,
  lat: number,
  meters: number,
  seed: number
): { lng: number; lat: number } {
  const r = (seed % 1000) / 1000;
  const angle = ((seed % 360) * Math.PI) / 180;
  const dist = meters * (0.35 + 0.65 * r);

  const dLat = (dist * Math.sin(angle)) / 111320;
  const dLng = (dist * Math.cos(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

  return { lng: lng + dLng, lat: lat + dLat };
}

// ─── Feature Collection Builders ───

/** Filter places with valid coordinates */
function withCoords(places: PlaceWithDistance[]) {
  return places.filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number');
}

/** Places → base point FeatureCollection */
export function toFeatureCollection(places: PlaceWithDistance[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: withCoords(places).map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
      properties: { id: p.id, name: p.name },
    })),
  };
}

/** Places → heatmap FeatureCollection with pseudo deal/interest scores */
export function toHeatFeatures(places: PlaceWithDistance[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: withCoords(places).map((p) => {
      const seed = hashSeed(p.id);
      const score = Math.min(1, 0.2 + ((seed % 100) / 100) * 0.8);
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
        properties: { id: p.id, weight: score },
      };
    }),
  };
}

/** Places → jittered peer dot FeatureCollection (4-10 dots per place, 240m radius) */
export function toPeerDots(places: PlaceWithDistance[]): FeatureCollection<Point> {
  const features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: { placeId: string };
  }[] = [];

  withCoords(places).forEach((p) => {
    const base = hashSeed(p.id);
    const dots = 4 + (base % 7);
    for (let i = 0; i < dots; i += 1) {
      const seed = base + i * 97;
      const j = jitterLngLat(p.longitude!, p.latitude!, 240, seed);
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [j.lng, j.lat] },
        properties: { placeId: p.id },
      });
    }
  });

  return { type: 'FeatureCollection', features };
}

// ─── DataBlock Value Helpers ───

/** Extract numeric value from DataBlock value (handles "23분" → 23) */
export function toNumericValue(value: DataBlock['value'] | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/[\d.]+/);
    return match ? Number.parseFloat(match[0]) : 0;
  }
  return 0;
}

/** Safely get numeric value from an optional DataBlock */
export function getBlockValue(block?: DataBlock): number {
  if (!block) return 0;
  return toNumericValue(block.value);
}
