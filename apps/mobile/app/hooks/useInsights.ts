import { useEffect, useMemo, useCallback } from 'react';
import { useInsightsStore } from '@/app/stores/insightsStore';
import type { DataBlock, PlaceInsights } from '@/app/types/dataBlock';

function normalizeIds(ids: string[]): string[] {
  return Array.from(new Set(ids)).filter(Boolean).sort();
}

export function useInsights(placeIds: string[]) {
  const ids = useMemo(() => normalizeIds(placeIds), [placeIds.join('|')]);
  const { insights, status, error, lastSource, fetchForPlaces } = useInsightsStore();

  useEffect(() => {
    if (ids.length === 0) return;
    fetchForPlaces(ids);
  }, [ids.join('|'), fetchForPlaces]);

  const insightsMap = useMemo(() => {
    const map = new Map<string, PlaceInsights>();
    ids.forEach((id) => {
      const entry = insights[id];
      if (entry) map.set(id, entry);
    });
    return map;
  }, [ids.join('|'), insights]);

  const stats = useMemo(() => {
    const blocks = Array.from(insightsMap.values()).flatMap((ins) =>
      Object.values(ins).filter((b): b is DataBlock => b != null)
    );
    const overallConfidence =
      blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length : 0.5;
    const sourceCount = new Set(blocks.map((b) => b.source)).size;

    return {
      blockCount: blocks.length,
      overallConfidence,
      sourceCount,
    };
  }, [insightsMap]);

  const refetch = useCallback(() => {
    return fetchForPlaces(ids);
  }, [ids, fetchForPlaces]);

  const isLoading = status === 'loading';

  return { insightsMap, stats, status, error, source: lastSource, refetch, isLoading };
}
