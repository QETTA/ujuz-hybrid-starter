// 모임 목록 Hook

import { useEffect, useCallback } from 'react';
import { usePeerGroupStore } from '@/app/stores/peerGroupStore';
import {
  fetchMyGroups,
  fetchPublicGroups,
  createPeerGroup,
  joinPeerGroup,
  leavePeerGroup,
} from '@/app/services/supabase/peerGroups';
import type { CreatePeerGroupInput } from '@/app/types/peerGroup';

export function usePeerGroups() {
  const { myGroups, isLoadingGroups, setMyGroups, addGroup, removeGroup, setLoadingGroups } =
    usePeerGroupStore();

  const loadMyGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const groups = await fetchMyGroups();
      setMyGroups(groups);
    } finally {
      setLoadingGroups(false);
    }
  }, [setMyGroups, setLoadingGroups]);

  const create = useCallback(
    async (input: CreatePeerGroupInput) => {
      const group = await createPeerGroup(input);
      if (group) {
        addGroup(group);
      }
      return group;
    },
    [addGroup]
  );

  const join = useCallback(
    async (
      groupId: string,
      profile?: { childName?: string; childBirthDate?: string; displayName?: string }
    ) => {
      const success = await joinPeerGroup(groupId, profile);
      if (success) {
        await loadMyGroups();
      }
      return success;
    },
    [loadMyGroups]
  );

  const leave = useCallback(
    async (groupId: string) => {
      const success = await leavePeerGroup(groupId);
      if (success) {
        removeGroup(groupId);
      }
      return success;
    },
    [removeGroup]
  );

  useEffect(() => {
    loadMyGroups();
  }, [loadMyGroups]);

  return {
    myGroups,
    isLoading: isLoadingGroups,
    refresh: loadMyGroups,
    create,
    join,
    leave,
    fetchPublicGroups,
  };
}
