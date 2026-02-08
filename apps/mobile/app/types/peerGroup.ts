// 또래 모임 타입 정의

export type PeerGroupRole = 'admin' | 'moderator' | 'member';
export type MemberStatus = 'active' | 'muted' | 'banned';
export type MessageType = 'text' | 'image' | 'link' | 'place' | 'groupbuy' | 'system';

export interface PeerGroup {
  id: string;
  name: string;
  description: string | null;
  min_age_months: number;
  max_age_months: number;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  region: string | null;
  image_url: string | null;
  max_members: number;
  is_public: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  member_count?: number;
  active_today?: number;
}

export interface PeerGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: PeerGroupRole;
  child_name: string | null;
  child_birth_date: string | null;
  display_name: string | null;
  status: MemberStatus;
  joined_at: string;
  last_seen_at: string;
}

export interface PeerGroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  edited_at: string | null;
  // 조인된 데이터
  sender?: {
    display_name: string;
    child_name: string;
  };
}

export interface CreatePeerGroupInput {
  name: string;
  description?: string;
  min_age_months?: number;
  max_age_months?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  region?: string;
  image_url?: string;
  max_members?: number;
  is_public?: boolean;
}

export interface SendMessageInput {
  group_id: string;
  content: string;
  message_type?: MessageType;
  metadata?: Record<string, unknown>;
  reply_to_id?: string;
}
