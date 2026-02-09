/**
 * Group Buy Service - Mongo API
 *
 * Provides group buy data access with:
 * - REST API calls (Mongo-backed)
 * - Offline-safe fallbacks
 * - Normalized data mapping for UI
 */

import { apiGet, apiPost, getApiBaseUrl, isOnline } from './client';
import type { GroupBuy, GroupBuyItemType, GroupBuyStatus } from '@/app/stores/groupBuyStore';

// Warn-once: only log the first network failure per session
let _groupBuyWarnedOnce = false;

// ============================================
// Types
// ============================================

export interface GroupBuyRow {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  item_type: GroupBuyItemType;
  ticket_id: string | null;
  product_id: string | null;
  goal_amount: number | null;
  goal_quantity: number | null;
  current_amount: number | null;
  current_quantity: number | null;
  achievement_rate: number | null;
  supporter_count: number | null;
  group_price: number | null;
  regular_price: number | null;
  max_discount_rate: number | null;
  start_date: string;
  end_date: string;
  status: GroupBuyStatus;
  thumbnail_url: string | null;
  tags: string[] | null;
  maker_name: string | null;
}

export interface GroupBuysQueryParams {
  status?: GroupBuyStatus[];
  itemType?: GroupBuyItemType;
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}

export interface GroupBuysQueryResult {
  groupBuys: GroupBuy[];
  total: number;
  hasMore: boolean;
  source: 'mongo' | 'mock';
}

export interface GroupBuyMutationResult {
  ok: boolean;
  reason?: 'offline' | 'no_client' | 'auth_required' | 'missing_price' | 'mongo_error';
}

export interface JoinedGroupBuysResult {
  ids: string[];
  source: 'mongo' | 'none';
}

const DEFAULT_STATUSES: GroupBuyStatus[] = ['active', 'upcoming'];

// ============================================
// Helpers
// ============================================

const toNumber = (value: number | null | undefined, fallback = 0) =>
  typeof value === 'number' ? value : fallback;

function computeAchievementRate(row: GroupBuyRow): number {
  if (typeof row.achievement_rate === 'number') {
    return row.achievement_rate;
  }

  const goalAmount = toNumber(row.goal_amount);
  const goalQuantity = toNumber(row.goal_quantity);
  const currentAmount = toNumber(row.current_amount);
  const currentQuantity = toNumber(row.current_quantity);

  if (goalAmount > 0) {
    return Math.round((currentAmount / goalAmount) * 100);
  }

  if (goalQuantity > 0) {
    return Math.round((currentQuantity / goalQuantity) * 100);
  }

  return 0;
}

function computeDiscountRate(row: GroupBuyRow): number | undefined {
  if (typeof row.max_discount_rate === 'number') {
    return row.max_discount_rate;
  }

  const regular = toNumber(row.regular_price);
  const group = toNumber(row.group_price);
  if (regular > 0 && group > 0 && group < regular) {
    return Math.round(((regular - group) / regular) * 100);
  }

  return undefined;
}

function normalizeGroupBuy(row: any): GroupBuy {
  const mapped = row as GroupBuyRow;
  return {
    id: mapped.id || row._id,
    title: mapped.title,
    subtitle: mapped.subtitle || undefined,
    description: mapped.description || undefined,
    item_type: mapped.item_type,
    ticket_id: mapped.ticket_id || undefined,
    product_id: mapped.product_id || undefined,
    goal_amount: mapped.goal_amount ?? undefined,
    goal_quantity: mapped.goal_quantity ?? undefined,
    current_amount: toNumber(mapped.current_amount),
    current_quantity: toNumber(mapped.current_quantity),
    achievement_rate: computeAchievementRate(mapped),
    supporter_count: toNumber(mapped.supporter_count),
    group_price: mapped.group_price ?? undefined,
    regular_price: mapped.regular_price ?? undefined,
    max_discount_rate: computeDiscountRate(mapped),
    start_date: mapped.start_date,
    end_date: mapped.end_date,
    status: mapped.status,
    thumbnail_url: mapped.thumbnail_url ?? undefined,
    tags: mapped.tags ?? undefined,
    maker_name: mapped.maker_name ?? undefined,
  };
}

// ============================================
// Service
// ============================================

export const groupBuyService = {
  async getGroupBuys(params: GroupBuysQueryParams = {}): Promise<GroupBuysQueryResult> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) {
      return { groupBuys: [], total: 0, hasMore: false, source: 'mock' };
    }

    const {
      status = DEFAULT_STATUSES,
      itemType,
      limit = 50,
      offset = 0,
      includeExpired = false,
    } = params;

    try {
      const result = await apiGet<any>('/group-buys', {
        status,
        itemType,
        limit,
        offset,
        includeExpired,
      });

      const rows = Array.isArray(result) ? result : result.groupBuys || result.data || [];
      const total = result.total ?? rows.length;
      const groupBuys = rows.map((row: any) => normalizeGroupBuy(row));

      return {
        groupBuys,
        total,
        hasMore: offset + limit < total,
        source: 'mongo',
      };
    } catch (error) {
      if (!_groupBuyWarnedOnce) {
        _groupBuyWarnedOnce = true;
        console.warn('[MongoGroupBuy] Server unreachable, using empty fallback. Further errors silenced.');
      }
      return { groupBuys: [], total: 0, hasMore: false, source: 'mock' };
    }
  },

  async getJoinedGroupBuyIds(): Promise<JoinedGroupBuysResult> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online || !base) return { ids: [], source: 'none' };

    try {
      const result = await apiGet<any>('/group-buys/joined');
      const ids = Array.isArray(result) ? result : result.ids || [];
      return { ids: Array.from(new Set(ids)), source: 'mongo' };
    } catch (error) {
      if (!_groupBuyWarnedOnce) {
        _groupBuyWarnedOnce = true;
        console.warn('[MongoGroupBuy] Server unreachable. Further errors silenced.');
      }
      return { ids: [], source: 'none' };
    }
  },

  async joinGroupBuy(groupBuyId: string): Promise<GroupBuyMutationResult> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online) return { ok: false, reason: 'offline' };
    if (!base) return { ok: false, reason: 'no_client' };

    try {
      await apiPost(`/group-buys/${groupBuyId}/join`);
      return { ok: true };
    } catch (error: any) {
      if (error?.status === 401) {
        return { ok: false, reason: 'auth_required' };
      }
      // User-facing: error propagated via result.reason
      return { ok: false, reason: 'mongo_error' };
    }
  },

  async leaveGroupBuy(groupBuyId: string): Promise<GroupBuyMutationResult> {
    const online = await isOnline();
    const base = getApiBaseUrl();
    if (!online) return { ok: false, reason: 'offline' };
    if (!base) return { ok: false, reason: 'no_client' };

    try {
      await apiPost(`/group-buys/${groupBuyId}/leave`);
      return { ok: true };
    } catch (error: any) {
      if (error?.status === 401) {
        return { ok: false, reason: 'auth_required' };
      }
      // User-facing: error propagated via result.reason
      return { ok: false, reason: 'mongo_error' };
    }
  },
};

export default groupBuyService;
