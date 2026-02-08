/**
 * UJUz - Supabase Auth Service
 * 인증 서비스 (이메일, 소셜, 익명)
 */

import { getSupabaseClient } from './client';
import type { UJUzUser, AuthProvider, SignUpInput, SignInInput } from '../../types/auth';

export interface EnsureUserResult {
  userId: string | null;
  source: 'session' | 'anonymous' | 'none';
}

const mapSupabaseUser = (user: Record<string, unknown>): UJUzUser => ({
  id: user.id as string,
  email: (user.email as string) ?? null,
  display_name: ((user.user_metadata as Record<string, unknown>)?.display_name as string) ?? null,
  avatar_url: ((user.user_metadata as Record<string, unknown>)?.avatar_url as string) ?? null,
  provider: ((user.app_metadata as Record<string, unknown>)?.provider as AuthProvider) ?? 'email',
  push_token: null,
  created_at: user.created_at as string,
  updated_at: user.updated_at as string,
});

export async function signUpWithEmail(
  input: SignUpInput
): Promise<{ user: UJUzUser | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { display_name: input.display_name } },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Registration failed' };
  return { user: mapSupabaseUser(data.user as unknown as Record<string, unknown>), error: null };
}

export async function signInWithEmail(
  input: SignInInput
): Promise<{ user: UJUzUser | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Login failed' };
  return { user: mapSupabaseUser(data.user as unknown as Record<string, unknown>), error: null };
}

export async function signInWithOAuth(
  provider: 'kakao' | 'apple'
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Supabase not configured' };

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: 'ujuz://auth/callback' },
  });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Supabase not configured' };

  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}

export async function refreshSession(): Promise<{ user: UJUzUser | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.auth.refreshSession();
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'No session' };
  return { user: mapSupabaseUser(data.user as unknown as Record<string, unknown>), error: null };
}

export async function getCurrentUser(): Promise<UJUzUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return mapSupabaseUser(data.user as unknown as Record<string, unknown>);
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function onAuthStateChange(callback: (user: UJUzUser | null) => void): (() => void) | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(mapSupabaseUser(session.user as unknown as Record<string, unknown>));
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

export async function ensureSupabaseUser(): Promise<EnsureUserResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { userId: null, source: 'none' };

  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;
    if (userId) return { userId, source: 'session' };
  } catch {
    // Fall through to anonymous
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signInAnonymously = (supabase.auth as any).signInAnonymously;
    if (typeof signInAnonymously !== 'function') return { userId: null, source: 'none' };
    const { data, error } = await signInAnonymously.call(supabase.auth);
    if (error) return { userId: null, source: 'none' };
    const userId = data?.user?.id ?? null;
    if (userId) return { userId, source: 'anonymous' };
  } catch {
    // Ignore
  }

  return { userId: null, source: 'none' };
}
