/**
 * UJUz - Auth Store
 * 인증 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UJUzUser, ChildProfile } from '../types/auth';

export interface AuthState {
  user: UJUzUser | null;
  children: ChildProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (user: UJUzUser | null) => void;
  setChildren: (children: ChildProfile[]) => void;
  addChild: (child: ChildProfile) => void;
  removeChild: (childId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setHydrated: (isHydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      children: [],
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      setChildren: (children) => set({ children }),

      addChild: (child) =>
        set((state) => ({
          children: [...state.children, child],
        })),

      removeChild: (childId) =>
        set((state) => ({
          children: state.children.filter((c) => c.id !== childId),
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (isHydrated) => set({ isHydrated }),

      logout: () =>
        set({
          user: null,
          children: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ujuz-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        children: state.children,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectChildren = (state: AuthState) => state.children;
