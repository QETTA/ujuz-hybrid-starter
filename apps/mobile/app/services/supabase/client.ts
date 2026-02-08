/**
 * Supabase Client for Mobile App
 *
 * Direct connection to Supabase for robust data access
 * - No backend server dependency
 * - Automatic reconnection handling
 * - Type-safe queries
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PeerGroup, PeerGroupMember, PeerGroupMessage } from '@/app/types/peerGroup';

// Database types
export interface PlaceRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  age_2_4: number | null;
  age_5_7: number | null;
  age_8_10: number | null;
  stroller_friendly: boolean | null;
  nursing_room: boolean | null;
  parking_easy: boolean | null;
  parking_free: boolean | null;
  restaurant_nearby: boolean | null;
  indoor_outdoor: 'indoor' | 'outdoor' | 'both' | null;
  best_season: string[] | null;
  rainy_day_ok: boolean | null;
  admission_fee: string | null;
  operating_hours: string | null;
  website_url: string | null;
  phone: string | null;
  image_url: string | null;
  popularity_score: number | null;
  source: string | null;
  verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      places: {
        Row: PlaceRow;
        Insert: Partial<PlaceRow> & { id: string; name: string; category: string };
        Update: Partial<PlaceRow>;
        Relationships: [];
      };
      peer_groups: {
        Row: PeerGroup;
        Insert: Partial<PeerGroup> & { name: string; creator_id: string };
        Update: Partial<PeerGroup>;
        Relationships: [];
      };
      peer_group_members: {
        Row: PeerGroupMember;
        Insert: Partial<PeerGroupMember> & { group_id: string; user_id: string };
        Update: Partial<PeerGroupMember>;
        Relationships: [];
      };
      peer_group_messages: {
        Row: PeerGroupMessage;
        Insert: Partial<PeerGroupMessage> & {
          group_id: string;
          sender_id: string;
          content: string;
        };
        Update: Partial<PeerGroupMessage>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_nearby_places: {
        Args: {
          user_lat: number;
          user_lon: number;
          radius_km?: number;
          category_filter?: string | null;
          limit_count?: number;
        };
        Returns: {
          id: string;
          name: string;
          category: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          rating: number | null;
          distance_km: number;
        }[];
      };
    };
  };
}

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing credentials. Using mock data fallback.');
}

// Create Supabase client with React Native AsyncStorage
let supabase: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  if (!supabase) {
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-client-info': 'ujuz-mobile',
        },
      },
    });
  }

  return supabase;
}

// Health check function
export async function checkSupabaseConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('places').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default getSupabaseClient;
