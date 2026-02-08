/**
 * Profile Store
 *
 * Minimal user/child profile state needed for:
 * - Group Buy orders (future: user profile)
 * - Peer Sync activity recording (requires child_birth_date)
 *
 * NOTE: This is intentionally simple and offline-first.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ProfileState {
  childName: string;
  /** ISO date (YYYY-MM-DD) */
  childBirthDate: string;

  setChildName: (name: string) => void;
  setChildBirthDate: (birthDate: string) => void;

  /** Derived */
  getChildAgeMonths: () => number;
}

export function getAgeInMonthsFromBirthDate(birthDate: string, now: Date = new Date()): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

  // If birthday day-of-month hasn't happened yet this month, subtract one month.
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

// Default: exactly 36 months old as of 2026-02-03 (project current date)
const DEFAULT_CHILD_BIRTH_DATE = '2023-02-03';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      childName: '우리 아이',
      childBirthDate: DEFAULT_CHILD_BIRTH_DATE,

      setChildName: (name) => set({ childName: name.trim() || '우리 아이' }),
      setChildBirthDate: (birthDate) => set({ childBirthDate: birthDate }),

      getChildAgeMonths: () => getAgeInMonthsFromBirthDate(get().childBirthDate),
    }),
    {
      name: 'ujuz-profile-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        childName: state.childName,
        childBirthDate: state.childBirthDate,
      }),
    }
  )
);
