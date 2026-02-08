// Supabase 또래 모임 서비스
// 참조 패턴: app/services/supabase/groupBuys.ts
// Note: peer_groups tables not yet in generated types, using type assertions
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getSupabaseClient } from './client';
import { ensureSupabaseUser } from './auth';
import type {
  PeerGroup,
  PeerGroupMember,
  PeerGroupMessage,
  CreatePeerGroupInput,
  SendMessageInput,
} from '@/app/types/peerGroup';

// ═══════════════════════════════════════════════════════════════════════════
// 모임 CRUD
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchMyGroups(): Promise<PeerGroup[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { userId } = await ensureSupabaseUser();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('peer_group_members')
    .select(
      `
      group_id,
      peer_groups:group_id (*)
    `
    )
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error || !data) return [];

  const rows = data as unknown as { peer_groups: PeerGroup | null }[];
  return rows.map((row) => row.peer_groups).filter(Boolean) as PeerGroup[];
}

export async function fetchPublicGroups(options?: {
  region?: string;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  limit?: number;
}): Promise<PeerGroup[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('peer_groups')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 20);

  if (options?.region) {
    query = query.ilike('region', `%${options.region}%`);
  }
  if (options?.minAgeMonths !== undefined) {
    query = query.lte('min_age_months', options.minAgeMonths);
  }
  if (options?.maxAgeMonths !== undefined) {
    query = query.gte('max_age_months', options.maxAgeMonths);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data as PeerGroup[];
}

export async function createPeerGroup(input: CreatePeerGroupInput): Promise<PeerGroup | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { userId } = await ensureSupabaseUser();
  if (!userId) return null;

  const { data, error } = await (supabase as any)
    .from('peer_groups')
    .insert({
      ...input,
      creator_id: userId,
    })
    .select()
    .single();

  if (error || !data) return null;

  // 생성자를 admin으로 자동 가입
  await (supabase as any).from('peer_group_members').insert({
    group_id: (data as any).id,
    user_id: userId,
    role: 'admin',
  });

  return data as PeerGroup;
}

export async function joinPeerGroup(
  groupId: string,
  profile?: {
    childName?: string;
    childBirthDate?: string;
    displayName?: string;
  }
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { userId } = await ensureSupabaseUser();
  if (!userId) return false;

  const { error } = await (supabase as any).from('peer_group_members').insert({
    group_id: groupId,
    user_id: userId,
    role: 'member',
    child_name: profile?.childName,
    child_birth_date: profile?.childBirthDate,
    display_name: profile?.displayName,
  });

  return !error;
}

export async function leavePeerGroup(groupId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { userId } = await ensureSupabaseUser();
  if (!userId) return false;

  const { error } = await supabase
    .from('peer_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  return !error;
}

// ═══════════════════════════════════════════════════════════════════════════
// 채팅 메시지
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchGroupMessages(
  groupId: string,
  options?: { limit?: number; before?: string }
): Promise<PeerGroupMessage[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('peer_group_messages')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 50);

  if (options?.before) {
    query = query.lt('created_at', options.before);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as PeerGroupMessage[]).reverse();
}

export async function sendMessage(input: SendMessageInput): Promise<PeerGroupMessage | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { userId } = await ensureSupabaseUser();
  if (!userId) return null;

  const { data, error } = await (supabase as any)
    .from('peer_group_messages')
    .insert({
      group_id: input.group_id,
      sender_id: userId,
      content: input.content,
      message_type: input.message_type || 'text',
      metadata: input.metadata || {},
      reply_to_id: input.reply_to_id,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as PeerGroupMessage;
}

// ═══════════════════════════════════════════════════════════════════════════
// Realtime 구독
// ═══════════════════════════════════════════════════════════════════════════

export function subscribeToChatMessages(
  groupId: string,
  onMessage: (msg: PeerGroupMessage) => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  type RealtimePayload = { new: unknown; old: unknown; eventType: string };

  const channel = supabase
    .channel(`group:${groupId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'peer_group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload: RealtimePayload) => {
        onMessage(payload.new as PeerGroupMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToMemberChanges(
  groupId: string,
  onChange: (member: PeerGroupMember, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  type RealtimePayload = { new: unknown; old: unknown; eventType: string };

  const channel = supabase
    .channel(`group:${groupId}:members`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'peer_group_members',
        filter: `group_id=eq.${groupId}`,
      },
      (payload: RealtimePayload) => {
        onChange(
          (payload.new || payload.old) as PeerGroupMember,
          payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
