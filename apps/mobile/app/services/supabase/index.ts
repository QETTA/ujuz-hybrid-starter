/**
 * Supabase Services Index
 * Updated for 또래 동기화 2026
 */

export { getSupabaseClient, checkSupabaseConnection } from './client';
export type { PlaceRow, Database } from './client';
export { placesService, type PlacesQueryParams, type PlacesQueryResult } from './places';
export { insightsService } from './insights';
export {
  groupBuyService,
  type GroupBuysQueryParams,
  type GroupBuysQueryResult,
  type GroupBuyMutationResult,
  type JoinedGroupBuysResult,
} from './groupBuys';
export * from './peerGroups';
export { ensureSupabaseUser, type EnsureUserResult } from './auth';
export { peerSyncService } from './peerSync';
export type { ChildProfileRow, PeerActivityRow, GroupBuyRow } from './peerSync';
