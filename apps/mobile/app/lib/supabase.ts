/**
 * Supabase Client for React Native
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type-safe query helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// Database types (simplified for now)
export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          name: string;
          category: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          image_url?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          place_id: string;
          name: string;
          original_price: number;
          sale_price?: number;
          discount_rate?: number;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          brand?: string;
          category: string;
          original_price: number;
          sale_price?: number;
        };
      };
      group_buys: {
        Row: {
          id: string;
          title: string;
          item_type: 'ticket' | 'product';
          ticket_id?: string;
          product_id?: string;
          status: string;
          current_amount: number;
          goal_amount?: number;
          supporter_count: number;
          thumbnail_url?: string;
        };
      };
    };
  };
}
