/**
 * UJUz - Admission Score Store
 * 입소 점수 예측 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdmissionScoreResult } from '../types/admission';

export interface AdmissionState {
  lastResult: AdmissionScoreResult | null;
  history: AdmissionScoreResult[];
  isCalculating: boolean;
  error: string | null;

  setLastResult: (result: AdmissionScoreResult | null) => void;
  setHistory: (history: AdmissionScoreResult[]) => void;
  addToHistory: (result: AdmissionScoreResult) => void;
  setCalculating: (isCalculating: boolean) => void;
  setError: (error: string | null) => void;
  clearHistory: () => void;
}

export const useAdmissionStore = create<AdmissionState>()(
  persist(
    (set) => ({
      lastResult: null,
      history: [],
      isCalculating: false,
      error: null,

      setLastResult: (result) => set({ lastResult: result, error: null }),

      setHistory: (history) => set({ history }),

      addToHistory: (result) =>
        set((state) => ({
          history: [result, ...state.history].slice(0, 50),
          lastResult: result,
        })),

      setCalculating: (isCalculating) => set({ isCalculating }),
      setError: (error) => set({ error }),
      clearHistory: () => set({ history: [], lastResult: null }),
    }),
    {
      name: 'ujuz-admission-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastResult: state.lastResult,
        history: state.history.slice(0, 10),
      }),
    }
  )
);

export const selectLastResult = (state: AdmissionState) => state.lastResult;
export const selectHistory = (state: AdmissionState) => state.history;
export const selectIsCalculating = (state: AdmissionState) => state.isCalculating;
