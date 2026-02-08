/**
 * UJUz - Group Buy State Store (React Native)
 *
 * 공동구매 데이터 관리 (활성 캠페인, 참여한 캠페인, 필터)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================

export type GroupBuyItemType = 'ticket' | 'product';
export type GroupBuyStatus = 'upcoming' | 'active' | 'success' | 'failed' | 'closed';

export interface GroupBuy {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;

  // 연결
  item_type: GroupBuyItemType;
  ticket_id?: string;
  product_id?: string;

  // 진행 상황
  goal_amount?: number;
  goal_quantity?: number;
  current_amount: number;
  current_quantity: number;
  achievement_rate: number;
  supporter_count: number;

  // 가격
  group_price?: number;
  regular_price?: number;
  max_discount_rate?: number;

  // 기간
  start_date: string;
  end_date: string;
  status: GroupBuyStatus;

  // 이미지
  thumbnail_url?: string;

  // 메타
  tags?: string[];
  maker_name?: string;
}

export interface GroupBuyFilter {
  itemType?: GroupBuyItemType;
  minDiscount?: number;
  sortBy: 'popular' | 'deadline' | 'discount' | 'newest';
}

export interface GroupBuyState {
  // 공동구매 목록
  groupBuys: GroupBuy[];
  isLoading: boolean;
  error: string | null;

  // 필터
  filter: GroupBuyFilter;

  // 참여한 공동구매
  joinedGroupBuyIds: string[];

  // 선택된 공동구매 (상세 보기)
  selectedGroupBuy: GroupBuy | null;

  // Actions
  setGroupBuys: (groupBuys: GroupBuy[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  setFilter: (filter: Partial<GroupBuyFilter>) => void;
  resetFilter: () => void;

  setJoinedGroupBuyIds: (ids: string[]) => void;
  joinGroupBuy: (groupBuyId: string) => void;
  leaveGroupBuy: (groupBuyId: string) => void;
  isJoined: (groupBuyId: string) => boolean;

  selectGroupBuy: (groupBuy: GroupBuy | null) => void;

  // Computed
  getFilteredGroupBuys: () => GroupBuy[];
  getJoinedGroupBuys: () => GroupBuy[];
  getGroupBuysByPlace: (placeId: string) => GroupBuy[];
  getGroupBuysByProduct: (productId: string) => GroupBuy[];
}

// ============================================
// Default Values
// ============================================

const DEFAULT_FILTER: GroupBuyFilter = {
  sortBy: 'popular',
};

// ============================================
// Store
// ============================================

export const useGroupBuyStore = create<GroupBuyState>()(
  persist(
    (set, get) => ({
      // Initial state
      groupBuys: [],
      isLoading: false,
      error: null,
      filter: DEFAULT_FILTER,
      joinedGroupBuyIds: [],
      selectedGroupBuy: null,

      // Actions
      setGroupBuys: (groupBuys) => set({ groupBuys }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      setFilter: (filter) =>
        set((state) => ({
          filter: { ...state.filter, ...filter },
        })),

      resetFilter: () => set({ filter: DEFAULT_FILTER }),

      setJoinedGroupBuyIds: (ids) => set({ joinedGroupBuyIds: Array.from(new Set(ids)) }),

      joinGroupBuy: (groupBuyId) =>
        set((state) => {
          // No-op if already joined (prevents double increments)
          if (state.joinedGroupBuyIds.includes(groupBuyId)) {
            return state;
          }

          return {
            // Optimistic: keep counts locally in sync for UI
            groupBuys: state.groupBuys.map((gb) => {
              if (gb.id !== groupBuyId) return gb;
              const nextQty = (gb.current_quantity ?? 0) + 1;
              return {
                ...gb,
                supporter_count: (gb.supporter_count ?? 0) + 1,
                current_quantity: nextQty,
                achievement_rate: gb.goal_quantity
                  ? Math.round((nextQty / gb.goal_quantity) * 100)
                  : gb.achievement_rate,
              };
            }),
            joinedGroupBuyIds: [...state.joinedGroupBuyIds, groupBuyId],
          };
        }),

      leaveGroupBuy: (groupBuyId) =>
        set((state) => {
          // No-op if not joined (prevents accidental decrements)
          if (!state.joinedGroupBuyIds.includes(groupBuyId)) {
            return state;
          }

          return {
            groupBuys: state.groupBuys.map((gb) => {
              if (gb.id !== groupBuyId) return gb;
              const nextSupporters = Math.max(0, (gb.supporter_count ?? 0) - 1);
              const nextQty = Math.max(0, (gb.current_quantity ?? 0) - 1);
              return {
                ...gb,
                supporter_count: nextSupporters,
                current_quantity: nextQty,
                achievement_rate: gb.goal_quantity
                  ? Math.round((nextQty / gb.goal_quantity) * 100)
                  : gb.achievement_rate,
              };
            }),
            joinedGroupBuyIds: state.joinedGroupBuyIds.filter((id) => id !== groupBuyId),
          };
        }),

      isJoined: (groupBuyId) => get().joinedGroupBuyIds.includes(groupBuyId),

      selectGroupBuy: (groupBuy) => set({ selectedGroupBuy: groupBuy }),

      // Computed
      getFilteredGroupBuys: () => {
        const { groupBuys, filter } = get();

        let filtered = groupBuys.filter((gb) => gb.status === 'active');

        // 타입 필터
        if (filter.itemType) {
          filtered = filtered.filter((gb) => gb.item_type === filter.itemType);
        }

        // 최소 할인율 필터
        if (filter.minDiscount) {
          filtered = filtered.filter((gb) => (gb.max_discount_rate || 0) >= filter.minDiscount!);
        }

        // 정렬
        switch (filter.sortBy) {
          case 'popular':
            filtered.sort((a, b) => b.supporter_count - a.supporter_count);
            break;
          case 'deadline':
            filtered.sort(
              (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
            );
            break;
          case 'discount':
            filtered.sort((a, b) => (b.max_discount_rate || 0) - (a.max_discount_rate || 0));
            break;
          case 'newest':
            filtered.sort(
              (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            );
            break;
        }

        return filtered;
      },

      getJoinedGroupBuys: () => {
        const { groupBuys, joinedGroupBuyIds } = get();
        return groupBuys.filter((gb) => joinedGroupBuyIds.includes(gb.id));
      },

      getGroupBuysByPlace: (placeId) => {
        const { groupBuys } = get();
        return groupBuys.filter((gb) => gb.item_type === 'ticket' && gb.ticket_id === placeId);
      },

      getGroupBuysByProduct: (productId) => {
        const { groupBuys } = get();
        return groupBuys.filter((gb) => gb.item_type === 'product' && gb.product_id === productId);
      },
    }),
    {
      name: 'ujuz-group-buy-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        joinedGroupBuyIds: state.joinedGroupBuyIds,
        filter: state.filter,
      }),
    }
  )
);

// ============================================
// Selectors (for performance)
// ============================================

export const selectGroupBuys = (state: GroupBuyState) => state.groupBuys;
export const selectIsLoading = (state: GroupBuyState) => state.isLoading;
export const selectFilter = (state: GroupBuyState) => state.filter;
export const selectJoinedIds = (state: GroupBuyState) => state.joinedGroupBuyIds;
