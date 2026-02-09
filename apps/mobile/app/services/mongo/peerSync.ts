/**
 * Peer Sync Service - Mongo API
 *
 * 또래 동기화 데이터 (Mongo 기반)
 * - 실시간 상태
 * - 활동 피드
 * - 트렌드
 * - 활동 기록 (best-effort)
 */

import { apiGet, apiPost, getApiBaseUrl, isOnline } from './client';
import type {
  PeerActivity,
  PeerActivityType,
  PeerLiveStatus,
  PeerTrends,
  PeerTrendingGroupBuy,
  PeerTrendingPlace,
  PeerTrendingShorts,
  TrendPeriod,
} from '@/app/types/peerSync';
import { MOCK_NEARBY_PLACES } from '@/app/data/mocks';

// Warn-once: only log the first network failure per session
let _peerSyncWarnedOnce = false;

function mockLiveStatus(): PeerLiveStatus {
  return {
    activeNow: Math.floor(Math.random() * 100) + 50,
    activeToday: Math.floor(Math.random() * 1000) + 500,
    nearbyActive: Math.floor(Math.random() * 30) + 10,
    lastUpdated: new Date().toISOString(),
  };
}

function mockActivities(childAgeMonths: number, limit: number, offset: number): PeerActivity[] {
  const base = offset + 1;
  const count = Math.min(limit, 5);
  return Array.from({ length: count }).map((_, idx) => ({
    id: `${base + idx}`,
    type: idx % 2 === 0 ? 'place_visit' : 'group_buy',
    peerCount: Math.floor(Math.random() * 30) + 5,
    place:
      idx % 2 === 0
        ? {
            id: `place-${base + idx}`,
            name: '뽀로로파크 강남점',
            category: 'kids_cafe',
            thumbnailUrl: 'https://picsum.photos/200/150?random=1',
          }
        : undefined,
    groupBuy:
      idx % 2 === 1
        ? {
            id: `gb-${base + idx}`,
            title: '에버랜드 자유이용권 50% 할인',
            discountPercent: 50,
            participantCount: 80 + idx,
          }
        : undefined,
    timestamp: new Date(Date.now() - (idx + 1) * 5 * 60 * 1000).toISOString(),
    message: `${childAgeMonths}개월 또래 활동 업데이트`,
  }));
}

function mockTrends(): PeerTrends {
  const placeA = MOCK_NEARBY_PLACES[0];
  const placeB = MOCK_NEARBY_PLACES[1] ?? MOCK_NEARBY_PLACES[0];

  const places: PeerTrendingPlace[] = [
    {
      place: placeA,
      peerVisitCount: 84,
      rankChange: 2,
      isTrending: true,
    },
    {
      place: placeB,
      peerVisitCount: 63,
      rankChange: -1,
      isTrending: false,
    },
  ];

  const groupBuys: PeerTrendingGroupBuy[] = [
    {
      id: 'gb-1',
      title: '키즈클럽 멤버십',
      category: 'ticket',
      originalPrice: 30000,
      discountedPrice: 19000,
      discountPercent: 35,
      peerParticipantCount: 40,
      totalParticipantCount: 120,
      hoursRemaining: 18,
      thumbnailUrl: placeA?.thumbnailUrl,
    },
  ];

  const topShorts: PeerTrendingShorts[] = [
    {
      id: 'shorts-1',
      youtubeId: 'dQw4w9WgXcQ',
      title: '키즈카페 브이로그',
      thumbnailUrl: placeA?.thumbnailUrl || 'https://picsum.photos/200/120?random=20',
      peerWatchCount: 42,
      relatedPlace: placeA ? { id: placeA.id, name: placeA.name } : undefined,
    },
  ];

  return {
    period: 'week',
    topPlaces: places,
    topGroupBuys: groupBuys,
    topShorts,
    updatedAt: new Date().toISOString(),
  };
}

export const peerSyncService = {
  async getLiveStatus(
    childAgeMonths: number,
    userLat?: number,
    userLng?: number
  ): Promise<PeerLiveStatus> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return mockLiveStatus();
    }

    try {
      const result = await apiGet<PeerLiveStatus>('/peer/live-status', {
        childAgeMonths,
        userLat,
        userLng,
      });
      return result ?? mockLiveStatus();
    } catch (error) {
      if (!_peerSyncWarnedOnce) {
        _peerSyncWarnedOnce = true;
        console.warn('[MongoPeerSync] Server unreachable, using mock data. Further errors silenced.');
      }
      return mockLiveStatus();
    }
  },

  async getRecentActivities(
    childAgeMonths: number,
    limit = 20,
    offset = 0
  ): Promise<PeerActivity[]> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return mockActivities(childAgeMonths, limit, offset);
    }

    try {
      const result = await apiGet<PeerActivity[]>('/peer/activities', {
        childAgeMonths,
        limit,
        offset,
      });
      return Array.isArray(result) ? result : mockActivities(childAgeMonths, limit, offset);
    } catch (error) {
      if (!_peerSyncWarnedOnce) {
        _peerSyncWarnedOnce = true;
        console.warn('[MongoPeerSync] Server unreachable, using mock data. Further errors silenced.');
      }
      return mockActivities(childAgeMonths, limit, offset);
    }
  },

  async getPeerTrends(childAgeMonths: number, period: TrendPeriod): Promise<PeerTrends> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return mockTrends();
    }

    try {
      const result = await apiGet<PeerTrends>('/peer/trends', {
        childAgeMonths,
        period,
      });
      return result ?? mockTrends();
    } catch (error) {
      if (!_peerSyncWarnedOnce) {
        _peerSyncWarnedOnce = true;
        console.warn('[MongoPeerSync] Server unreachable, using mock data. Further errors silenced.');
      }
      return mockTrends();
    }
  },

  async recordActivity(
    activityType: PeerActivityType,
    options: {
      childBirthDate: string;
      childId?: string;
      placeId?: string;
      groupBuyId?: string;
      shortsId?: string;
      message?: string;
    }
  ): Promise<void> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return;
    }

    try {
      await apiPost('/peer/activities', {
        activityType,
        childBirthDate: options.childBirthDate,
        childId: options.childId,
        placeId: options.placeId,
        groupBuyId: options.groupBuyId,
        shortsId: options.shortsId,
        message: options.message,
      });
    } catch (error) {
      // Silent: best-effort only
    }
  },
};

export default peerSyncService;
