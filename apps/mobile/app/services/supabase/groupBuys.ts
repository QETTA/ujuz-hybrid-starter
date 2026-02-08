/**
 * Group Buy Service - Supabase Direct Access
 *
 * Provides group buy data access with:
 * - Direct Supabase queries
 * - Offline-safe fallbacks
 * - Normalized data mapping for UI
 */

import NetInfo from '@react-native-community/netinfo';
import { getSupabaseClient } from './client';
import { ensureSupabaseUser } from './auth';
import type { GroupBuy, GroupBuyItemType, GroupBuyStatus } from '@/app/stores/groupBuyStore';

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
  source: 'supabase' | 'mock';
}

export interface GroupBuyMutationResult {
  ok: boolean;
  reason?: 'offline' | 'no_client' | 'auth_required' | 'missing_price' | 'supabase_error';
}

export interface JoinedGroupBuysResult {
  ids: string[];
  source: 'supabase' | 'none';
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

function mapRowToGroupBuy(row: GroupBuyRow): GroupBuy {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    description: row.description || undefined,
    item_type: row.item_type,
    ticket_id: row.ticket_id || undefined,
    product_id: row.product_id || undefined,
    goal_amount: row.goal_amount ?? undefined,
    goal_quantity: row.goal_quantity ?? undefined,
    current_amount: toNumber(row.current_amount),
    current_quantity: toNumber(row.current_quantity),
    achievement_rate: computeAchievementRate(row),
    supporter_count: toNumber(row.supporter_count),
    group_price: row.group_price ?? undefined,
    regular_price: row.regular_price ?? undefined,
    max_discount_rate: computeDiscountRate(row),
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    thumbnail_url: row.thumbnail_url ?? undefined,
    tags: row.tags ?? undefined,
    maker_name: row.maker_name ?? undefined,
  };
}

async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return false;
  }
}

// ============================================
// Service
// ============================================

export const groupBuyService = {
  /**
   * Fetch group buys with optional filters
   */
  async getGroupBuys(params: GroupBuysQueryParams = {}): Promise<GroupBuysQueryResult> {
    const online = await isOnline();
    if (!online) {
      return { groupBuys: [], total: 0, hasMore: false, source: 'mock' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
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
      let query = supabase.from('group_buys').select('*', { count: 'exact' }).in('status', status);

      if (!includeExpired) {
        query = query.gte('end_date', new Date().toISOString());
      }

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { data, error, count } = await query
        .order('supporter_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      const rows = (data || []) as GroupBuyRow[];
      const groupBuys = rows.map(mapRowToGroupBuy);
      const total = count ?? groupBuys.length;

      return {
        groupBuys,
        total,
        hasMore: offset + limit < total,
        source: 'supabase',
      };
    } catch (error) {
      console.error('[GroupBuyService] Failed to fetch group buys:', error);
      return { groupBuys: [], total: 0, hasMore: false, source: 'mock' };
    }
  },

  /**
   * Fetch joined group buy ids for the current user (orders table).
   * Requires auth (session or anonymous sign-in).
   */
  async getJoinedGroupBuyIds(): Promise<JoinedGroupBuysResult> {
    const online = await isOnline();
    if (!online) return { ids: [], source: 'none' };

    const supabase = getSupabaseClient();
    if (!supabase) return { ids: [], source: 'none' };

    const { userId } = await ensureSupabaseUser();
    if (!userId) return { ids: [], source: 'none' };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('group_buy_id')
        .eq('user_id', userId)
        .in('status', ['pending', 'paid', 'confirmed', 'shipping', 'delivered']);

      if (error) {
        console.warn('[GroupBuyService] getJoinedGroupBuyIds failed:', error);
        return { ids: [], source: 'none' };
      }

      const ids = (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => row.group_buy_id)
        .filter((id: unknown): id is string => typeof id === 'string');

      // Unique, stable order
      return { ids: Array.from(new Set(ids)), source: 'supabase' };
    } catch (error) {
      console.warn('[GroupBuyService] getJoinedGroupBuyIds threw:', error);
      return { ids: [], source: 'none' };
    }
  },

  /**
   * Join a group buy by inserting into orders.
   * NOTE: RLS requires `auth.uid() = user_id` so user must be authenticated.
   */
  async joinGroupBuy(groupBuyId: string): Promise<GroupBuyMutationResult> {
    const online = await isOnline();
    if (!online) return { ok: false, reason: 'offline' };

    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, reason: 'no_client' };

    const { userId } = await ensureSupabaseUser();
    if (!userId) return { ok: false, reason: 'auth_required' };

    try {
      // If order already exists, treat as success (idempotent)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('group_buy_id', groupBuyId)
        .limit(1);

      if (Array.isArray(existing) && existing.length > 0) {
        return { ok: true };
      }

      // Fetch price from group_buys for required order fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: gb, error: gbError } = await (supabase as any)
        .from('group_buys')
        .select('id, group_price, regular_price')
        .eq('id', groupBuyId)
        .single();

      if (gbError) {
        console.warn('[GroupBuyService] joinGroupBuy fetch group_buy failed:', gbError);
        return { ok: false, reason: 'supabase_error' };
      }

      const unitPrice = (gb?.group_price ?? gb?.regular_price) as number | null | undefined;
      if (!unitPrice || unitPrice <= 0) {
        return { ok: false, reason: 'missing_price' };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('orders').insert({
        user_id: userId,
        group_buy_id: groupBuyId,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
        status: 'pending',
      });

      if (error) {
        console.warn('[GroupBuyService] joinGroupBuy insert failed:', error);
        return { ok: false, reason: 'supabase_error' };
      }

      return { ok: true };
    } catch (error) {
      console.warn('[GroupBuyService] joinGroupBuy threw:', error);
      return { ok: false, reason: 'supabase_error' };
    }
  },

  /**
   * Leave a group buy by deleting from orders.
   */
  async leaveGroupBuy(groupBuyId: string): Promise<GroupBuyMutationResult> {
    const online = await isOnline();
    if (!online) return { ok: false, reason: 'offline' };

    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, reason: 'no_client' };

    const { userId } = await ensureSupabaseUser();
    if (!userId) return { ok: false, reason: 'auth_required' };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('orders')
        .delete()
        .eq('user_id', userId)
        .eq('group_buy_id', groupBuyId);

      if (error) {
        console.warn('[GroupBuyService] leaveGroupBuy delete failed:', error);
        return { ok: false, reason: 'supabase_error' };
      }

      return { ok: true };
    } catch (error) {
      console.warn('[GroupBuyService] leaveGroupBuy threw:', error);
      return { ok: false, reason: 'supabase_error' };
    }
  },
};

export default groupBuyService;
