/**
 * Mongo API Client (Mobile)
 *
 * Uses the shared Axios client (`app/services/api/client.ts`) so:
 * - env resolution is consistent (@env)
 * - retry/backoff + network checks are centralized
 */

import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '@env';
import { api } from '@/app/services/api/client';

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

function normalizeBaseUrl(url: string): string | null {
  const trimmed = (url || '').trim();
  if (!trimmed) return null;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function getApiBaseUrl(): string | null {
  return normalizeBaseUrl(API_BASE_URL);
}

export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return false;
  }
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('API_BASE_URL not configured');
  }
  // `api` already has baseURL set; pass relative path.
  return api.get<T>(path, { params });
}

export async function apiPost<T>(path: string, body?: Record<string, unknown> | null): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('API_BASE_URL not configured');
  }
  return api.post<T>(path, body ?? undefined);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('API_BASE_URL not configured');
  }
  return api.delete<T>(path);
}
