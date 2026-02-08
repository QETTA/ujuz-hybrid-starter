import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PermissionStatus = 'unknown' | 'granted' | 'denied';

export interface OnboardingState {
  hasHydrated: boolean;
  hasOnboarded: boolean;
  locationPermission: PermissionStatus;
  notificationPermission: PermissionStatus;
  preferredRegion: string;
  childPreference: 'indoor' | 'outdoor' | 'mixed';
  budgetPreference: 'low' | 'mid' | 'high';
  travelRadiusKm: number;

  setHasHydrated: (value: boolean) => void;
  setHasOnboarded: (value: boolean) => void;
  setLocationPermission: (value: PermissionStatus) => void;
  setNotificationPermission: (value: PermissionStatus) => void;
  setPreferredRegion: (value: string) => void;
  setChildPreference: (value: OnboardingState['childPreference']) => void;
  setBudgetPreference: (value: OnboardingState['budgetPreference']) => void;
  setTravelRadiusKm: (value: number) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasOnboarded: false,
      locationPermission: 'unknown',
      notificationPermission: 'unknown',
      preferredRegion: '서울',
      childPreference: 'mixed',
      budgetPreference: 'mid',
      travelRadiusKm: 5,

      setHasHydrated: (value) => set({ hasHydrated: value }),
      setHasOnboarded: (value) => set({ hasOnboarded: value }),
      setLocationPermission: (value) => set({ locationPermission: value }),
      setNotificationPermission: (value) => set({ notificationPermission: value }),
      setPreferredRegion: (value) => set({ preferredRegion: value }),
      setChildPreference: (value) => set({ childPreference: value }),
      setBudgetPreference: (value) => set({ budgetPreference: value }),
      setTravelRadiusKm: (value) => set({ travelRadiusKm: value }),
    }),
    {
      name: 'ujuz-onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        locationPermission: state.locationPermission,
        notificationPermission: state.notificationPermission,
        preferredRegion: state.preferredRegion,
        childPreference: state.childPreference,
        budgetPreference: state.budgetPreference,
        travelRadiusKm: state.travelRadiusKm,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
