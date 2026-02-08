/**
 * UJUz - Notification & TO Alert Store
 * TO 알림 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TOSubscription, TOAlert, NotificationPreferences } from '../types/toAlert';

export interface NotificationState {
  subscriptions: TOSubscription[];
  alerts: TOAlert[];
  unreadCount: number;
  pushToken: string | null;
  preferences: NotificationPreferences;
  isLoading: boolean;

  setSubscriptions: (subscriptions: TOSubscription[]) => void;
  addSubscription: (subscription: TOSubscription) => void;
  removeSubscription: (facilityId: string) => void;

  setAlerts: (alerts: TOAlert[]) => void;
  markAlertRead: (alertId: string) => void;
  markAllRead: () => void;

  setPushToken: (token: string | null) => void;
  setPreferences: (prefs: Partial<NotificationPreferences>) => void;
  setLoading: (isLoading: boolean) => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push: true,
  sms: false,
  email: false,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      subscriptions: [],
      alerts: [],
      unreadCount: 0,
      pushToken: null,
      preferences: DEFAULT_PREFERENCES,
      isLoading: false,

      setSubscriptions: (subscriptions) => set({ subscriptions }),

      addSubscription: (subscription) =>
        set((state) => ({
          subscriptions: [...state.subscriptions, subscription],
        })),

      removeSubscription: (facilityId) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.facility_id !== facilityId),
        })),

      setAlerts: (alerts) =>
        set({
          alerts,
          unreadCount: alerts.filter((a) => !a.is_read).length,
        }),

      markAlertRead: (alertId) =>
        set((state) => {
          const updated = state.alerts.map((a) => (a.id === alertId ? { ...a, is_read: true } : a));
          return {
            alerts: updated,
            unreadCount: updated.filter((a) => !a.is_read).length,
          };
        }),

      markAllRead: () =>
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, is_read: true })),
          unreadCount: 0,
        })),

      setPushToken: (token) => set({ pushToken: token }),

      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'ujuz-notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        pushToken: state.pushToken,
        preferences: state.preferences,
      }),
    }
  )
);

export const selectUnreadCount = (state: NotificationState) => state.unreadCount;
export const selectSubscriptions = (state: NotificationState) => state.subscriptions;
