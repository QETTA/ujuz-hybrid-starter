/**
 * UJUz - Group Buy Data Hook
 *
 * Supabase에서 공동구매 데이터 가져오기
 */

import { useEffect, useCallback } from 'react';
import { groupBuyService, peerSyncService } from '@/app/services/mongo';
import { useGroupBuyStore, GroupBuy } from '@/app/stores/groupBuyStore';
import { useProfileStore } from '@/app/stores/profileStore';

export function useGroupBuys() {
  const {
    groupBuys,
    isLoading,
    error,
    filter,
    setGroupBuys,
    setLoading,
    setError,
    setJoinedGroupBuyIds,
    getFilteredGroupBuys,
    getJoinedGroupBuys,
  } = useGroupBuyStore();

  const fetchGroupBuys = useCallback(async () => {
    setLoading(true);
    setError(null);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('요청 시간이 초과되었어요')), 10000)
    );

    try {
      const { groupBuys } = await Promise.race([
        groupBuyService.getGroupBuys({ status: ['active', 'upcoming'] }),
        timeout,
      ]);
      setGroupBuys(groupBuys as GroupBuy[]);

      // Sync joined state from server (orders) when possible
      const joined = await groupBuyService.getJoinedGroupBuyIds();
      if (joined.source === 'mongo') {
        setJoinedGroupBuyIds(joined.ids);
      }
    } catch (err: any) {
      setError(err?.message || '공동구매 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [setGroupBuys, setJoinedGroupBuyIds, setLoading, setError]);

  // 초기 로드
  useEffect(() => {
    if (groupBuys.length === 0) {
      fetchGroupBuys();
    }
  }, []);

  return {
    groupBuys,
    filteredGroupBuys: getFilteredGroupBuys(),
    joinedGroupBuys: getJoinedGroupBuys(),
    isLoading,
    error,
    filter,
    refetch: fetchGroupBuys,
  };
}

export function useGroupBuysByTicket(ticketId: string | undefined) {
  const { groupBuys } = useGroupBuyStore();

  if (!ticketId) return [];

  return groupBuys.filter((gb) => gb.item_type === 'ticket' && gb.ticket_id === ticketId);
}

export function useGroupBuysByProduct(productId: string | undefined) {
  const { groupBuys } = useGroupBuyStore();

  if (!productId) return [];

  return groupBuys.filter((gb) => gb.item_type === 'product' && gb.product_id === productId);
}

export function useGroupBuyActions() {
  const childBirthDate = useProfileStore((s) => s.childBirthDate);

  const {
    joinGroupBuy: joinGroupBuyLocal,
    leaveGroupBuy: leaveGroupBuyLocal,
    isJoined,
    selectGroupBuy,
    setFilter,
    resetFilter,
    setError,
  } = useGroupBuyStore();

  const joinGroupBuy = useCallback(
    (groupBuyId: string) => {
      // Optimistic UI update
      joinGroupBuyLocal(groupBuyId);
      setError(null);

      void (async () => {
        const result = await groupBuyService.joinGroupBuy(groupBuyId);
        if (!result.ok) {
          // Rollback so UI doesn't lie about persistence.
          leaveGroupBuyLocal(groupBuyId);
          setError(
            result.reason === 'auth_required'
              ? '로그인이 필요합니다.'
              : '서버에 참여 정보 반영에 실패했습니다.'
          );
          return;
        }

        // Peer Sync activity (best-effort)
        await peerSyncService.recordActivity('group_buy', {
          childBirthDate,
          groupBuyId,
          message: '공동구매에 참여했어요',
        });
      })();
    },
    [childBirthDate, joinGroupBuyLocal, leaveGroupBuyLocal, setError]
  );

  const leaveGroupBuy = useCallback(
    (groupBuyId: string) => {
      // Optimistic UI update
      leaveGroupBuyLocal(groupBuyId);
      setError(null);

      void (async () => {
        const result = await groupBuyService.leaveGroupBuy(groupBuyId);
        if (!result.ok) {
          // Rollback
          joinGroupBuyLocal(groupBuyId);
          setError(
            result.reason === 'auth_required'
              ? '로그인이 필요합니다.'
              : '서버에 취소 정보 반영에 실패했습니다.'
          );
        }
      })();
    },
    [joinGroupBuyLocal, leaveGroupBuyLocal, setError]
  );

  return {
    joinGroupBuy,
    leaveGroupBuy,
    isJoined,
    selectGroupBuy,
    setFilter,
    resetFilter,
  };
}
