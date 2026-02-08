import { create } from 'zustand';
import { insightsService, type InsightsResult } from '@/app/services/mongo/insights';
import type { PlaceInsights } from '@/app/types/dataBlock';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface InsightsState {
  insights: Record<string, PlaceInsights>;
  status: LoadStatus;
  error: string | null;
  lastSource: InsightsResult['source'] | null;
  fetchForPlaces: (placeIds: string[]) => Promise<void>;
  clear: () => void;
}

const inFlight = new Set<string>();

export const useInsightsStore = create<InsightsState>((set, get) => ({
  insights: {},
  status: 'idle',
  error: null,
  lastSource: null,

  fetchForPlaces: async (placeIds) => {
    const uniqueIds = Array.from(new Set(placeIds)).filter(Boolean);
    if (uniqueIds.length === 0) return;

    // Prevent concurrent duplicate fetches
    const key = uniqueIds.sort().join('|');
    if (inFlight.has(key)) return;
    inFlight.add(key);

    set({ status: 'loading', error: null });
    try {
      const result = await insightsService.getInsightsForPlaces(uniqueIds);
      const next: Record<string, PlaceInsights> = { ...get().insights };
      result.insights.forEach((value, id) => {
        next[id] = value;
      });
      set({ insights: next, status: 'ready', lastSource: result.source });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load insights';
      set({ status: 'error', error: message });
    } finally {
      inFlight.delete(key);
    }
  },

  clear: () => set({ insights: {}, status: 'idle', error: null, lastSource: null }),
}));
