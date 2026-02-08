/**
 * Peer Sync Service - Supabase Direct Access
 *
 * 2026 KidsMap 킬러 기능: 또래 동기화
 * - 또래 부모들의 실시간 활동 추적
 * - 또래 인기 장소/공구 트렌드
 * - FOMO 기반 engagement
 */

import { getSupabaseClient } from './client';
import { ensureSupabaseUser } from './auth';
import type {
  PeerActivity,
  PeerActivityType,
  PeerLiveStatus,
  PeerTrends,
  PeerTrendingPlace,
  PeerTrendingGroupBuy,
} from '@/app/types/peerSync';

// ============================================
// Database Types
// ============================================

export interface ChildProfileRow {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other' | null;
  created_at: string;
  updated_at: string;
}

export interface PeerActivityRow {
  id: string;
  user_id: string;
  child_id: string;
  activity_type: PeerActivityType;
  place_id: string | null;
  group_buy_id: string | null;
  shorts_id: string | null;
  message: string | null;
  created_at: string;
  // Joined data
  child_birth_date?: string;
  place_name?: string;
  place_category?: string;
  place_thumbnail_url?: string;
}

export interface GroupBuyRow {
  id: string;
  title: string;
  item_type: 'ticket' | 'product';
  group_price: number | null;
  regular_price: number | null;
  max_discount_rate: number | null;
  supporter_count: number | null;
  end_date: string;
  thumbnail_url: string | null;
  status: 'upcoming' | 'active' | 'success' | 'failed' | 'closed';
}

// ============================================
// Query Helpers
// ============================================

/**
 * Calculate age in months from birth date
 * @internal Used for peer matching
 */
function _getAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}
// Export for potential future use
export { _getAgeInMonths as getAgeInMonths };

/**
 * Get peer age range (±3 months)
 */
function getPeerAgeRange(childAgeMonths: number): { minAge: number; maxAge: number } {
  return {
    minAge: Math.max(0, childAgeMonths - 3),
    maxAge: childAgeMonths + 3,
  };
}

/**
 * Calculate birth date range from age range
 */
function getBirthDateRange(
  minAgeMonths: number,
  maxAgeMonths: number
): { minDate: string; maxDate: string } {
  const now = new Date();
  const minDate = new Date(now);
  minDate.setMonth(minDate.getMonth() - maxAgeMonths);
  const maxDate = new Date(now);
  maxDate.setMonth(maxDate.getMonth() - minAgeMonths);

  return {
    minDate: minDate.toISOString().split('T')[0],
    maxDate: maxDate.toISOString().split('T')[0],
  };
}

// ============================================
// Peer Sync Service
// ============================================

export const peerSyncService = {
  /**
   * Get live peer status for a specific age group
   */
  async getLiveStatus(
    childAgeMonths: number,
    _userLat?: number,
    _userLng?: number
  ): Promise<PeerLiveStatus> {
    const supabase = getSupabaseClient();

    // Default mock data for development
    const mockStatus: PeerLiveStatus = {
      activeNow: Math.floor(Math.random() * 100) + 50,
      activeToday: Math.floor(Math.random() * 1000) + 500,
      nearbyActive: Math.floor(Math.random() * 30) + 10,
      lastUpdated: new Date().toISOString(),
    };

    if (!supabase) {
      console.log('[PeerSyncService] No Supabase client, using mock status');
      return mockStatus;
    }

    try {
      const { minAge, maxAge } = getPeerAgeRange(childAgeMonths);
      const { minDate, maxDate } = getBirthDateRange(minAge, maxAge);

      // Activity windows
      const nowMinus15Min = new Date(Date.now() - 15 * 60 * 1000);
      const nowMinus24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Query active now (last 15 minutes)
      // Note: Using 'as any' because peer_activities table type is not in Database yet
      const { count: activeNow } = await (supabase as any)
        .from('peer_activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', nowMinus15Min.toISOString())
        .gte('child_birth_date', minDate)
        .lte('child_birth_date', maxDate);

      // Query active today (last 24 hours)
      const { count: activeToday } = await (supabase as any)
        .from('peer_activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', nowMinus24Hours.toISOString())
        .gte('child_birth_date', minDate)
        .lte('child_birth_date', maxDate);

      // TODO: Nearby calculation requires PostGIS extension
      const nearbyActive = mockStatus.nearbyActive;

      return {
        activeNow: activeNow || mockStatus.activeNow,
        activeToday: activeToday || mockStatus.activeToday,
        nearbyActive,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[PeerSyncService] getLiveStatus failed:', error);
      return mockStatus;
    }
  },

  /**
   * Get recent peer activities
   */
  async getRecentActivities(
    childAgeMonths: number,
    limit = 20,
    offset = 0
  ): Promise<PeerActivity[]> {
    const supabase = getSupabaseClient();

    // Mock data for development
    const mockActivities: PeerActivity[] = [
      {
        id: '1',
        type: 'place_visit',
        peerCount: Math.floor(Math.random() * 20) + 5,
        place: {
          id: 'place-1',
          name: '뽀로로파크 강남점',
          category: 'kids_cafe',
          thumbnailUrl: 'https://picsum.photos/200/150?random=1',
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        message: `${childAgeMonths}개월 또래 12명이 방금 방문했어요`,
      },
      {
        id: '2',
        type: 'group_buy',
        peerCount: Math.floor(Math.random() * 50) + 20,
        groupBuy: {
          id: 'gb-1',
          title: '에버랜드 자유이용권 50% 할인',
          discountPercent: 50,
          participantCount: 89,
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        message: '또래 45명이 참여 중인 공구예요',
      },
      {
        id: '3',
        type: 'shorts_watch',
        peerCount: Math.floor(Math.random() * 100) + 30,
        shorts: {
          id: 'shorts-1',
          title: '아기랑 서울숲 나들이 브이로그',
          thumbnailUrl: 'https://picsum.photos/200/150?random=2',
          viewCount: 15200,
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        message: '또래 부모들이 많이 본 영상이에요',
      },
    ];

    if (!supabase) {
      return mockActivities;
    }

    try {
      const { minAge, maxAge } = getPeerAgeRange(childAgeMonths);
      const { minDate, maxDate } = getBirthDateRange(minAge, maxAge);

      const { data, error } = await (supabase as any)
        .from('peer_activities')
        .select(
          `
          id,
          activity_type,
          message,
          created_at,
          place_id,
          group_buy_id,
          shorts_id,
          places:place_id (id, name, category, image_url),
          group_buys:group_buy_id (id, title, max_discount_rate, supporter_count, group_price, regular_price)
        `
        )
        .gte('child_birth_date', minDate)
        .lte('child_birth_date', maxDate)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error || !data || data.length === 0) {
        return mockActivities;
      }

      // Map to PeerActivity type
      return data.map(
        (row: any): PeerActivity => ({
          id: row.id,
          type: row.activity_type,
          peerCount: Math.floor(Math.random() * 30) + 5, // TODO: Aggregate peer count
          place: row.places
            ? {
                id: row.places.id,
                name: row.places.name,
                category: row.places.category,
                thumbnailUrl: row.places.image_url,
              }
            : undefined,
          groupBuy: row.group_buys
            ? {
                id: row.group_buys.id,
                title: row.group_buys.title,
                discountPercent:
                  row.group_buys.max_discount_rate ??
                  (row.group_buys.regular_price && row.group_buys.group_price
                    ? Math.round(
                        ((row.group_buys.regular_price - row.group_buys.group_price) /
                          row.group_buys.regular_price) *
                          100
                      )
                    : 0),
                participantCount: row.group_buys.supporter_count ?? 0,
              }
            : undefined,
          timestamp: row.created_at,
          message: row.message || `또래들의 ${row.activity_type} 활동`,
        })
      );
    } catch (error) {
      console.error('[PeerSyncService] getRecentActivities failed:', error);
      return mockActivities;
    }
  },

  /**
   * Get trending places among peers
   */
  async getTrendingPlaces(
    _childAgeMonths: number,
    _period: 'today' | 'week' | 'month' = 'week',
    _limit = 5
  ): Promise<PeerTrendingPlace[]> {
    const supabase = getSupabaseClient();

    // Mock trending places
    const mockTrending: PeerTrendingPlace[] = [
      {
        place: {
          id: 'p1',
          source: 'TOUR_API',
          sourceUrl: '',
          fetchedAt: '',
          name: '키즈카페 플레이타임',
          category: 'kids_cafe',
          address: '서울 강남구',
          latitude: 37.5,
          longitude: 127.0,
          thumbnailUrl: 'https://picsum.photos/200/150?random=10',
          rawData: {},
        },
        peerVisitCount: Math.floor(Math.random() * 200) + 100,
        rankChange: Math.floor(Math.random() * 5) - 2,
        isTrending: Math.random() > 0.5,
      },
      {
        place: {
          id: 'p2',
          source: 'TOUR_API',
          sourceUrl: '',
          fetchedAt: '',
          name: '어린이대공원',
          category: 'nature_park',
          address: '서울 광진구',
          latitude: 37.5,
          longitude: 127.0,
          thumbnailUrl: 'https://picsum.photos/200/150?random=11',
          rawData: {},
        },
        peerVisitCount: Math.floor(Math.random() * 200) + 80,
        rankChange: 0,
        isTrending: false,
      },
      {
        place: {
          id: 'p3',
          source: 'TOUR_API',
          sourceUrl: '',
          fetchedAt: '',
          name: '국립중앙박물관 어린이박물관',
          category: 'museum',
          address: '서울 용산구',
          latitude: 37.5,
          longitude: 127.0,
          thumbnailUrl: 'https://picsum.photos/200/150?random=12',
          rawData: {},
        },
        peerVisitCount: Math.floor(Math.random() * 150) + 50,
        rankChange: -1,
        isTrending: false,
      },
    ];

    if (!supabase) {
      return mockTrending;
    }

    // TODO: Implement actual Supabase query with aggregation
    // This requires a database function or view for efficient aggregation
    return mockTrending;
  },

  /**
   * Get trending group buys among peers
   */
  async getTrendingGroupBuys(_childAgeMonths: number, limit = 3): Promise<PeerTrendingGroupBuy[]> {
    const supabase = getSupabaseClient();

    // Mock trending group buys
    const mockGroupBuys: PeerTrendingGroupBuy[] = [
      {
        id: 'gb1',
        title: '에버랜드 자유이용권',
        category: 'ticket',
        originalPrice: 65000,
        discountedPrice: 32500,
        discountPercent: 50,
        peerParticipantCount: Math.floor(Math.random() * 100) + 50,
        totalParticipantCount: 120,
        hoursRemaining: Math.floor(Math.random() * 48) + 1,
        thumbnailUrl: 'https://picsum.photos/200/150?random=20',
      },
      {
        id: 'gb2',
        title: '유기농 이유식 세트',
        category: 'food',
        originalPrice: 45000,
        discountedPrice: 29900,
        discountPercent: 33,
        peerParticipantCount: Math.floor(Math.random() * 60) + 30,
        totalParticipantCount: 80,
        hoursRemaining: Math.floor(Math.random() * 72) + 24,
        thumbnailUrl: 'https://picsum.photos/200/150?random=21',
      },
    ];

    if (!supabase) {
      return mockGroupBuys;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('group_buys')
        .select(
          'id, title, item_type, group_price, regular_price, max_discount_rate, supporter_count, end_date, thumbnail_url, status'
        )
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('supporter_count', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        return mockGroupBuys;
      }

      return data.map((row: GroupBuyRow): PeerTrendingGroupBuy => {
        const deadline = new Date(row.end_date);
        const hoursRemaining = Math.max(
          0,
          Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
        );

        const regularPrice = row.regular_price ?? row.group_price ?? 0;
        const groupPrice = row.group_price ?? row.regular_price ?? 0;
        const discountPercent =
          row.max_discount_rate ??
          (regularPrice > 0 && groupPrice > 0
            ? Math.round(((regularPrice - groupPrice) / regularPrice) * 100)
            : 0);

        return {
          id: row.id,
          title: row.title,
          category: row.item_type === 'ticket' ? 'ticket' : 'food',
          originalPrice: regularPrice,
          discountedPrice: groupPrice,
          discountPercent,
          peerParticipantCount: Math.floor((row.supporter_count ?? 0) * 0.7),
          totalParticipantCount: row.supporter_count ?? 0,
          hoursRemaining,
          thumbnailUrl: row.thumbnail_url || undefined,
        };
      });
    } catch (error) {
      console.error('[PeerSyncService] getTrendingGroupBuys failed:', error);
      return mockGroupBuys;
    }
  },

  /**
   * Get full peer trends data
   */
  async getPeerTrends(
    childAgeMonths: number,
    period: 'today' | 'week' | 'month' = 'week'
  ): Promise<PeerTrends> {
    const [topPlaces, topGroupBuys] = await Promise.all([
      this.getTrendingPlaces(childAgeMonths, period),
      this.getTrendingGroupBuys(childAgeMonths),
    ]);

    return {
      period,
      topPlaces,
      topGroupBuys,
      topShorts: [], // TODO: Implement
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Record a peer activity
   */
  async recordActivity(
    activityType: PeerActivityType,
    options: {
      /** ISO date (YYYY-MM-DD) */
      childBirthDate: string;
      childId?: string;
      placeId?: string;
      groupBuyId?: string;
      shortsId?: string;
      message?: string;
    }
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[PeerSyncService] No Supabase client, skipping activity record');
      return;
    }

    try {
      const { userId } = await ensureSupabaseUser();
      if (!userId) {
        console.warn('[PeerSyncService] No auth user, skipping activity record');
        return;
      }

      const { error } = await (supabase as any).from('peer_activities').insert({
        user_id: userId,
        child_id: options.childId || null,
        child_birth_date: options.childBirthDate,
        activity_type: activityType,
        place_id: options.placeId || null,
        group_buy_id: options.groupBuyId || null,
        shorts_id: options.shortsId || null,
        message: options.message || null,
      });

      if (error) {
        console.error('[PeerSyncService] recordActivity failed:', error);
      }
    } catch (error) {
      console.error('[PeerSyncService] recordActivity error:', error);
    }
  },
};

export default peerSyncService;
