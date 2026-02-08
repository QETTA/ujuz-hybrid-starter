// Zustand 또래 모임 스토어
// 참조 패턴: app/stores/groupBuyStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PeerGroup, PeerGroupMessage } from '@/app/types/peerGroup';

interface PeerGroupState {
  // 데이터
  myGroups: PeerGroup[];
  currentGroupId: string | null;
  messages: Record<string, PeerGroupMessage[]>; // groupId -> messages

  // 로딩 상태
  isLoadingGroups: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  // 액션
  setMyGroups: (groups: PeerGroup[]) => void;
  addGroup: (group: PeerGroup) => void;
  removeGroup: (groupId: string) => void;
  setCurrentGroupId: (groupId: string | null) => void;

  // 메시지 액션
  setMessages: (groupId: string, messages: PeerGroupMessage[]) => void;
  addMessage: (groupId: string, message: PeerGroupMessage) => void;
  addOptimisticMessage: (groupId: string, message: PeerGroupMessage) => void;
  confirmMessage: (groupId: string, tempId: string, confirmedMessage: PeerGroupMessage) => void;

  // 로딩 상태 액션
  setLoadingGroups: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setSending: (sending: boolean) => void;

  // 리셋
  reset: () => void;
}

const initialState = {
  myGroups: [],
  currentGroupId: null,
  messages: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  isSending: false,
};

export const usePeerGroupStore = create<PeerGroupState>()(
  persist(
    (set) => ({
      ...initialState,

      setMyGroups: (groups) => set({ myGroups: groups }),

      addGroup: (group) =>
        set((state) => ({
          myGroups: [group, ...state.myGroups.filter((g) => g.id !== group.id)],
        })),

      removeGroup: (groupId) =>
        set((state) => ({
          myGroups: state.myGroups.filter((g) => g.id !== groupId),
          messages: Object.fromEntries(
            Object.entries(state.messages).filter(([id]) => id !== groupId)
          ),
        })),

      setCurrentGroupId: (groupId) => set({ currentGroupId: groupId }),

      setMessages: (groupId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [groupId]: messages },
        })),

      addMessage: (groupId, message) =>
        set((state) => {
          const existing = state.messages[groupId] || [];
          if (existing.some((m) => m.id === message.id)) {
            return state;
          }
          return {
            messages: {
              ...state.messages,
              [groupId]: [...existing, message],
            },
          };
        }),

      addOptimisticMessage: (groupId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [groupId]: [...(state.messages[groupId] || []), message],
          },
        })),

      confirmMessage: (groupId, tempId, confirmedMessage) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [groupId]: (state.messages[groupId] || []).map((m) =>
              m.id === tempId ? confirmedMessage : m
            ),
          },
        })),

      setLoadingGroups: (loading) => set({ isLoadingGroups: loading }),
      setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
      setSending: (sending) => set({ isSending: sending }),

      reset: () => set(initialState),
    }),
    {
      name: 'peer-group-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        myGroups: state.myGroups,
      }),
    }
  )
);
