/**
 * UJUz - Authentication Types
 */

export type AuthProvider = 'email' | 'kakao' | 'naver' | 'apple' | 'anonymous';

export interface UJUzUser {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: AuthProvider;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildProfile {
  id: string;
  user_id: string;
  nickname: string;
  birth_date: string;
  age_class: AgeClass;
  target_facilities: string[];
  priority_types: PriorityType[];
  created_at: string;
}

export type AgeClass = '0세반' | '1세반' | '2세반' | '3세반' | '4세반' | '5세반';

export type PriorityType =
  | 'dual_income'
  | 'single_parent'
  | 'multi_child'
  | 'disability'
  | 'government_merit'
  | 'low_income'
  | 'basic_livelihood'
  | 'near_workplace'
  | 'sibling_enrolled'
  | 'none';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: UJUzUser;
}

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  child?: {
    nickname: string;
    birth_date: string;
  };
}

export interface SignInInput {
  email: string;
  password: string;
}
