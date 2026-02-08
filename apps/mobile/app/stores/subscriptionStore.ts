/**
 * UJUz - Subscription Store
 * 구독 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSubscription, PlanTier } from '../types/subscription';
import { PLAN_LIMITS } from '../types/subscription';

export interface SubscriptionState {
  subscription: UserSubscription | null;
  isLoading: boolean;
  error: string | null;

  setSubscription: (subscription: UserSubscription | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  getCurrentTier: () => PlanTier;
  canUseFeature: (feature: keyof typeof PLAN_LIMITS.free) => boolean;
  getRemainingQuota: (feature: 'admission_score_limit' | 'bot_query_daily_limit') => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      isLoading: false,
      error: null,

      setSubscription: (subscription) => set({ subscription }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      getCurrentTier: (): PlanTier => {
        const sub = get().subscription;
        if (!sub || sub.status !== 'active') return 'free';
        return sub.plan.tier;
      },

      canUseFeature: (feature) => {
        const tier = get().getCurrentTier();
        const limits = PLAN_LIMITS[tier];
        const value = limits[feature];
        if (typeof value === 'boolean') return value;
        if (value === -1) return true;

        const sub = get().subscription;
        if (!sub) return value > 0;

        if (feature === 'admission_score_limit') {
          return sub.usage.admission_scores_used < value;
        }
        if (feature === 'bot_query_daily_limit') {
          return sub.usage.bot_queries_today < value;
        }
        if (feature === 'to_alert_facility_limit') {
          return sub.usage.to_alerts_active < value;
        }

        return true;
      },

      getRemainingQuota: (feature) => {
        const tier = get().getCurrentTier();
        const limit = PLAN_LIMITS[tier][feature];
        if (limit === -1) return Infinity;

        const sub = get().subscription;
        if (!sub) return limit;

        if (feature === 'admission_score_limit') {
          return Math.max(0, limit - sub.usage.admission_scores_used);
        }
        if (feature === 'bot_query_daily_limit') {
          return Math.max(0, limit - sub.usage.bot_queries_today);
        }

        return limit;
      },
    }),
    {
      name: 'ujuz-subscription-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);

export const selectCurrentTier = (state: SubscriptionState) => state.getCurrentTier();
