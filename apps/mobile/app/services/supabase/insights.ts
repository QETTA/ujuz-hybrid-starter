/**
 * Place Insights Service - Supabase Direct Access
 *
 * Fetches per-place insights as DataBlocks with safe fallbacks.
 */

import NetInfo from '@react-native-community/netinfo';
import { getSupabaseClient } from './client';
import { AsyncStorageService } from '@/app/services/storage/AsyncStorageService';
import { CACHE_TTL } from '@/app/constants';
import { MOCK_PLACE_INSIGHTS } from '@/app/data/mocks';
import type { DataBlock, PlaceInsights } from '@/app/types/dataBlock';

const CACHE_KEY = 'ujuz.insights.cache.v1';

type SerializedDataBlock = Omit<DataBlock, 'updatedAt'> & { updatedAt: string };
type SerializedInsights = {
  waitTime?: SerializedDataBlock;
  crowdLevel?: SerializedDataBlock;
  safetyScore?: SerializedDataBlock;
  dealCount?: SerializedDataBlock;
  peerVisits?: SerializedDataBlock;
};

type CachedPayload = {
  cachedAt: string;
  data: Record<string, SerializedInsights>;
};

export interface InsightsResult {
  insights: Map<string, PlaceInsights>;
  source: 'supabase' | 'cache' | 'mock';
}

function serializeBlock(block: DataBlock): SerializedDataBlock {
  return { ...block, updatedAt: block.updatedAt.toISOString() };
}

function deserializeBlock(block?: SerializedDataBlock): DataBlock | undefined {
  if (!block) return undefined;
  return { ...block, updatedAt: new Date(block.updatedAt) };
}

function serializeInsights(insights: PlaceInsights): SerializedInsights {
  return {
    waitTime: insights.waitTime ? serializeBlock(insights.waitTime) : undefined,
    crowdLevel: insights.crowdLevel ? serializeBlock(insights.crowdLevel) : undefined,
    safetyScore: insights.safetyScore ? serializeBlock(insights.safetyScore) : undefined,
    dealCount: insights.dealCount ? serializeBlock(insights.dealCount) : undefined,
    peerVisits: insights.peerVisits ? serializeBlock(insights.peerVisits) : undefined,
  };
}

function deserializeInsights(insights: SerializedInsights): PlaceInsights {
  return {
    waitTime: deserializeBlock(insights.waitTime),
    crowdLevel: deserializeBlock(insights.crowdLevel),
    safetyScore: deserializeBlock(insights.safetyScore),
    dealCount: deserializeBlock(insights.dealCount),
    peerVisits: deserializeBlock(insights.peerVisits),
  };
}

async function readCache(): Promise<CachedPayload | null> {
  return AsyncStorageService.getItem<CachedPayload>(CACHE_KEY);
}

async function writeCache(payload: CachedPayload): Promise<void> {
  await AsyncStorageService.setItem(CACHE_KEY, payload);
}

function mergeCache(base: Record<string, PlaceInsights>, next: Map<string, PlaceInsights>) {
  const merged: Record<string, PlaceInsights> = { ...base };
  next.forEach((value, key) => {
    merged[key] = value;
  });
  return merged;
}

function mapRowToInsights(row: any): PlaceInsights {
  const toBlock = (
    value: string | number | null | undefined,
    source: string | null | undefined,
    updatedAt: string | null | undefined,
    confidence: number | null | undefined,
    provenanceUrl?: string | null
  ): DataBlock | undefined => {
    if (value === null || value === undefined) return undefined;
    return {
      value,
      source: (source || 'public_api') as DataBlock['source'],
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      confidence: typeof confidence === 'number' ? confidence : 0.6,
      provenanceUrl: provenanceUrl || undefined,
    };
  };

  return {
    waitTime: toBlock(
      row.wait_time_minutes ? `${row.wait_time_minutes}분` : row.wait_time_text,
      row.wait_time_source,
      row.wait_time_updated_at,
      row.wait_time_confidence,
      row.wait_time_provenance_url
    ),
    crowdLevel: toBlock(
      row.crowd_level,
      row.crowd_level_source,
      row.crowd_level_updated_at,
      row.crowd_level_confidence
    ),
    safetyScore: toBlock(
      row.safety_score ?? row.safety_level,
      row.safety_score_source ?? row.safety_level_source,
      row.safety_score_updated_at ?? row.safety_level_updated_at,
      row.safety_score_confidence ?? row.safety_level_confidence
    ),
    dealCount: toBlock(
      row.deal_count,
      row.deal_count_source,
      row.deal_count_updated_at,
      row.deal_count_confidence
    ),
    peerVisits: toBlock(
      row.peer_visits ?? row.peer_visit_count,
      row.peer_visits_source ?? row.peer_visit_source,
      row.peer_visits_updated_at ?? row.peer_visit_updated_at,
      row.peer_visits_confidence ?? row.peer_visit_confidence
    ),
  };
}

async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return false;
  }
}

export const insightsService = {
  async getInsightsForPlaces(placeIds: string[]): Promise<InsightsResult> {
    const uniqueIds = Array.from(new Set(placeIds)).filter(Boolean);
    if (uniqueIds.length === 0) return { insights: new Map(), source: 'cache' };

    const cache = await readCache();
    const cacheAge = cache?.cachedAt ? Date.now() - new Date(cache.cachedAt).getTime() : Infinity;
    const cacheFresh = cache && cacheAge < CACHE_TTL.MEDIUM;

    if (cacheFresh) {
      const cachedMap = new Map<string, PlaceInsights>();
      uniqueIds.forEach((id) => {
        const entry = cache.data[id];
        if (entry) cachedMap.set(id, deserializeInsights(entry));
      });
      if (cachedMap.size === uniqueIds.length) {
        return { insights: cachedMap, source: 'cache' };
      }
    }

    const online = await isOnline();
    const supabase = getSupabaseClient();
    if (!online || !supabase) {
      const fallback = new Map<string, PlaceInsights>();
      uniqueIds.forEach((id) => {
        const mock = MOCK_PLACE_INSIGHTS.get(id);
        if (mock) fallback.set(id, mock);
      });
      return { insights: fallback, source: 'mock' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('place_insights')
        .select('*')
        .in('place_id', uniqueIds);

      if (error) {
        throw new Error(error.message);
      }

      const map = new Map<string, PlaceInsights>();
      (data || []).forEach((row: any) => {
        if (!row.place_id) return;
        map.set(row.place_id, mapRowToInsights(row));
      });

      // Merge with cache + mock for missing ids
      uniqueIds.forEach((id) => {
        if (!map.has(id)) {
          const mock = MOCK_PLACE_INSIGHTS.get(id);
          if (mock) map.set(id, mock);
        }
      });

      const merged = mergeCache(
        cache?.data
          ? Object.fromEntries(
              Object.entries(cache.data).map(([k, v]) => [k, deserializeInsights(v)])
            )
          : {},
        map
      );

      await writeCache({
        cachedAt: new Date().toISOString(),
        data: Object.fromEntries(
          Object.entries(merged).map(([id, insights]) => [id, serializeInsights(insights)])
        ),
      });

      return { insights: map, source: 'supabase' };
    } catch (error) {
      console.warn('[InsightsService] Failed to fetch insights:', error);
      const fallback = new Map<string, PlaceInsights>();
      uniqueIds.forEach((id) => {
        const mock = MOCK_PLACE_INSIGHTS.get(id);
        if (mock) fallback.set(id, mock);
      });
      return { insights: fallback, source: 'mock' };
    }
  },
};

export default insightsService;
