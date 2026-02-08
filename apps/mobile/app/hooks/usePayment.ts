/**
 * UJUz - usePayment Hook
 * 결제 및 구독 관리 훅
 */

import { useCallback } from 'react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { api } from '../services/api/client';
import type {
  SubscriptionPlan,
  UserSubscription,
  PaymentRequest,
  PaymentResult,
} from '../types/subscription';

export function usePayment() {
  const {
    subscription,
    isLoading,
    error,
    setSubscription,
    setLoading,
    setError,
    getCurrentTier,
    canUseFeature,
    getRemainingQuota,
  } = useSubscriptionStore();

  const fetchPlans = useCallback(async (): Promise<SubscriptionPlan[]> => {
    try {
      const data = await api.get<{ plans: SubscriptionPlan[] }>('/api/ujuz/subscriptions/plans');
      return data.plans;
    } catch {
      return [];
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<UserSubscription>('/api/ujuz/subscriptions/me');
      setSubscription(data);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [setSubscription, setLoading]);

  const subscribe = useCallback(
    async (request: PaymentRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.post<PaymentResult>('/api/ujuz/payments/request', request);
        if (result.status === 'completed') {
          await fetchSubscription();
        }
        return { result, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : '결제에 실패했습니다';
        setError(message);
        return { result: null, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, fetchSubscription]
  );

  const cancelSubscription = useCallback(async () => {
    setLoading(true);
    try {
      await api.delete('/api/ujuz/subscriptions/me');
      await fetchSubscription();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : '구독 해지에 실패했습니다' };
    } finally {
      setLoading(false);
    }
  }, [setLoading, fetchSubscription]);

  return {
    subscription,
    currentTier: getCurrentTier(),
    isLoading,
    error,
    fetchPlans,
    fetchSubscription,
    subscribe,
    cancelSubscription,
    canUseFeature,
    getRemainingQuota,
  };
}
