/**
 * UJUz - useNotifications Hook
 * TO 알림 및 푸시 알림 관리
 */

import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useNotificationStore } from '../stores/notificationStore';
import { api } from '../services/api/client';
import type { TOSubscription, TOAlertHistory } from '../types/toAlert';
import type { AgeClass } from '../types/auth';

export function useNotifications() {
  const {
    subscriptions,
    alerts,
    unreadCount,
    pushToken,
    preferences,
    isLoading,
    setSubscriptions,
    addSubscription,
    removeSubscription,
    setAlerts,
    markAlertRead,
    markAllRead,
    setPushToken,
    setPreferences,
    setLoading,
  } = useNotificationStore();

  const registerPushToken = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const { default: Notifications } = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      setPushToken(tokenData.data);

      await api.post('/api/ujuz/users/me/push-token', { token: tokenData.data });
    } catch {
      // Push not available
    }
  }, [setPushToken]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ subscriptions: TOSubscription[] }>('/api/ujuz/alerts/to');
      setSubscriptions(data.subscriptions);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [setSubscriptions, setLoading]);

  const subscribeFacility = useCallback(
    async (facilityId: string, facilityName: string, targetClasses: AgeClass[]) => {
      try {
        const sub = await api.post<TOSubscription>('/api/ujuz/alerts/to', {
          facility_id: facilityId,
          facility_name: facilityName,
          target_classes: targetClasses,
          notification_preferences: preferences,
        });
        addSubscription(sub);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : '구독에 실패했습니다' };
      }
    },
    [preferences, addSubscription]
  );

  const unsubscribeFacility = useCallback(
    async (facilityId: string) => {
      try {
        await api.delete(`/api/ujuz/alerts/to/${facilityId}`);
        removeSubscription(facilityId);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : '구독 해제에 실패했습니다' };
      }
    },
    [removeSubscription]
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.get<TOAlertHistory>('/api/ujuz/alerts/to/history');
      setAlerts(data.alerts);
    } catch {
      // Silent fail
    }
  }, [setAlerts]);

  useEffect(() => {
    registerPushToken();
  }, [registerPushToken]);

  return {
    subscriptions,
    alerts,
    unreadCount,
    pushToken,
    preferences,
    isLoading,
    fetchSubscriptions,
    subscribeFacility,
    unsubscribeFacility,
    fetchAlerts,
    markAlertRead,
    markAllRead,
    setPreferences,
  };
}
