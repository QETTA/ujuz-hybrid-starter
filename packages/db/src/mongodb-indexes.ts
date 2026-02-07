/**
 * MongoDB Index SSOT (Single Source of Truth)
 *
 * All collection indexes defined in one place.
 * server/mongodb.ts, scripts/queue/mongodb-client.ts all reference this file.
 *
 * createIndex is idempotent - no-op if already exists.
 * TTL changes require drop + recreate (one-time migration script).
 */

import type { CreateIndexesOptions, IndexSpecification, Db } from 'mongodb';

export interface IndexDef {
  key: IndexSpecification;
  name: string;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
}

/**
 * Per-collection index definitions.
 * Keys are logical collection names (admission_blocks etc. can be overridden at runtime).
 */
export const INDEXES: Record<string, IndexDef[]> = {
  // -- Places
  places: [
    { key: { location: '2dsphere' }, name: 'location_2dsphere' },
    { key: { name: 'text', address: 'text' }, name: 'name_text_address_text' },
    { key: { placeId: 1 }, name: 'idx_places_placeid' },
  ],

  // -- Refined Insights
  refinedInsights: [
    { key: { placeId: 1, category: 1, refinedAt: -1 }, name: 'idx_insights_place_cat_refined' },
    { key: { confidence: -1 }, name: 'idx_insights_confidence' },
    { key: { expiresAt: 1 }, name: 'idx_insights_ttl', expireAfterSeconds: 0 },
  ],

  // -- Peer Activities
  peerActivities: [
    { key: { childBirthDate: 1, createdAt: -1 }, name: 'idx_peer_birthdate_created' },
    { key: { activityType: 1, createdAt: -1 }, name: 'idx_peer_type_created' },
    { key: { placeId: 1, createdAt: -1 }, name: 'idx_peer_place_created' },
    { key: { userId: 1, createdAt: -1 }, name: 'idx_peer_user_created' },
    { key: { createdAt: 1 }, name: 'idx_peer_ttl', expireAfterSeconds: 60 * 24 * 60 * 60 },
  ],

  // -- Data Blocks
  dataBlocks: [
    { key: { blockType: 1, isActive: 1 }, name: 'idx_blocks_type_active' },
    { key: { targetType: 1, targetId: 1 }, name: 'idx_blocks_target' },
    { key: { validUntil: 1 }, name: 'idx_blocks_valid_ttl', expireAfterSeconds: 0 },
    { key: { tags: 1 }, name: 'idx_blocks_tags' },
    { key: { block_id: 1 }, name: 'idx_blocks_blockid', unique: true },
    { key: { facility_id: 1, block_type: 1 }, name: 'idx_blocks_facility_type' },
    { key: { blockType: 1, validUntil: 1 }, name: 'idx_blocks_type_valid' },
    { key: { targetId: 1, blockType: 1 }, name: 'idx_blocks_target_type' },
    { key: { isActive: 1, priority: -1 }, name: 'idx_blocks_active_priority' },
    { key: { facility_id: 1, block_type: 1, confidence: -1 }, name: 'idx_blocks_facility_type_conf' },
    { key: { targetId: 1, blockType: 1, isActive: 1, confidence: -1 }, name: 'idx_blocks_target_type_active_conf' },
  ],

  // -- Admission Scores (v0, legacy)
  admission_scores: [
    { key: { user_id: 1, created_at: -1 }, name: 'idx_as_user_created' },
    { key: { facility_id: 1 }, name: 'idx_as_facility' },
    { key: { created_at: 1 }, name: 'idx_as_ttl', expireAfterSeconds: 7 * 24 * 60 * 60 },
  ],

  // -- Waitlist Snapshots
  waitlist_snapshots: [
    { key: { facility_id: 1, snapshot_date: -1 }, name: 'idx_ws_facility_date' },
    { key: { 'change.to_detected': 1, snapshot_date: -1 }, name: 'idx_ws_todetected_date' },
    { key: { snapshot_date: 1 }, name: 'idx_ws_ttl', expireAfterSeconds: 180 * 24 * 60 * 60 },
    { key: { facility_id: 1, 'change.to_detected': 1, snapshot_date: 1 }, name: 'idx_ws_facility_todetected_date' },
  ],

  // -- Admission Scores V1
  admission_scores_v1: [
    { key: { facility_id: 1, created_at: -1 }, name: 'idx_asv1_facility_created' },
    { key: { cacheKey: 1, expires_at: 1 }, name: 'idx_asv1_cache' },
    { key: { expires_at: 1 }, name: 'idx_asv1_ttl', expireAfterSeconds: 0 },
  ],

  // -- Admission Blocks
  admission_blocks: [
    { key: { facility_id: 1, block_type: 1 }, name: 'idx_ab_facility_blocktype' },
    { key: { block_type: 1, is_active: 1 }, name: 'idx_ab_type_active' },
    { key: { valid_until: 1 }, name: 'idx_ab_ttl', expireAfterSeconds: 0 },
    { key: { facility_id: 1, is_active: 1, valid_until: 1, block_type: 1 }, name: 'idx_ab_facility_active_valid_type' },
  ],

  // -- TO Subscriptions
  to_subscriptions: [
    { key: { user_id: 1, is_active: 1 }, name: 'idx_tosub_user_active' },
    { key: { facility_id: 1 }, name: 'idx_tosub_facility' },
    { key: { user_id: 1, facility_id: 1, is_active: 1 }, name: 'idx_tosub_user_facility_active' },
  ],

  // -- TO Alerts
  to_alerts: [
    { key: { facility_id: 1, detected_at: -1 }, name: 'idx_ta_facility_detected' },
    { key: { detected_at: 1 }, name: 'idx_ta_ttl', expireAfterSeconds: 90 * 24 * 60 * 60 },
  ],

  // -- Partners / Referrals / External Ingest (UJUz Hybrid)
  partner_orgs: [
    { key: { org_id: 1 }, name: 'idx_partner_org_id', unique: true },
    { key: { status: 1, created_at: -1 }, name: 'idx_partner_org_status_created' },
  ],
  partner_cafes: [
    { key: { cafe_id: 1 }, name: 'idx_partner_cafe_id', unique: true },
    { key: { org_id: 1 }, name: 'idx_partner_cafe_org' },
    { key: { platform: 1, platform_cafe_id: 1 }, name: 'idx_partner_cafe_platform', unique: true, sparse: true },
    { key: { status: 1, created_at: -1 }, name: 'idx_partner_cafe_status_created' },
  ],
  partner_api_keys: [
    { key: { key_id: 1 }, name: 'idx_partner_key_id', unique: true },
    { key: { org_id: 1, revoked_at: 1 }, name: 'idx_partner_key_org_revoked' },
    { key: { key_hash: 1 }, name: 'idx_partner_key_hash', unique: true },
  ],
  referral_links: [
    { key: { code: 1 }, name: 'idx_ref_link_code', unique: true },
    { key: { cafe_id: 1, is_active: 1, created_at: -1 }, name: 'idx_ref_link_cafe_active_created' },
  ],
  referral_events: [
    { key: { code: 1, created_at: -1 }, name: 'idx_ref_event_code_created' },
    { key: { type: 1, created_at: -1 }, name: 'idx_ref_event_type_created' },
    { key: { user_id: 1, created_at: -1 }, name: 'idx_ref_event_user_created', sparse: true },
    { key: { device_id: 1, created_at: -1 }, name: 'idx_ref_event_device_created', sparse: true },
  ],
  referral_attributions: [
    { key: { user_id: 1 }, name: 'idx_ref_attr_user', unique: true, sparse: true },
    { key: { device_id: 1 }, name: 'idx_ref_attr_device', unique: true, sparse: true },
    { key: { expires_at: 1 }, name: 'idx_ref_attr_ttl', expireAfterSeconds: 0 },
  ],
  payout_ledgers: [
    { key: { cafe_id: 1, period: 1 }, name: 'idx_payout_cafe_period', unique: true },
    { key: { period: 1, updated_at: -1 }, name: 'idx_payout_period_updated' },
  ],
  partner_widgets: [
    { key: { widget_key: 1 }, name: 'idx_widget_key', unique: true },
    { key: { cafe_id: 1, is_active: 1, created_at: -1 }, name: 'idx_widget_cafe_active_created' },
  ],
  external_posts: [
    { key: { cafe_id: 1, external_id: 1 }, name: 'idx_extpost_cafe_external', unique: true },
    { key: { cafe_id: 1, posted_at: -1 }, name: 'idx_extpost_cafe_posted' },
    { key: { cafe_id: 1, to_mention: 1, posted_at: -1 }, name: 'idx_extpost_cafe_to_posted' },
  ],
  to_detections: [
    { key: { cafe_id: 1, created_at: -1 }, name: 'idx_tod_cafe_created' },
    { key: { external_post_id: 1 }, name: 'idx_tod_extpost', unique: true },
    { key: { created_at: 1 }, name: 'idx_tod_ttl', expireAfterSeconds: 180 * 24 * 60 * 60 },
  ],

  // -- Conversations
  conversations: [
    { key: { user_id: 1, updated_at: -1 }, name: 'idx_conv_user_updated' },
    { key: { created_at: 1 }, name: 'idx_conv_ttl', expireAfterSeconds: 30 * 24 * 60 * 60 },
  ],

  // -- User Subscriptions
  user_subscriptions: [
    { key: { user_id: 1, status: 1 }, name: 'idx_usub_user_status' },
  ],

  // -- Group Buys
  group_buys: [
    { key: { status: 1, supporter_count: -1 }, name: 'idx_gb_status_supporters' },
    { key: { participants: 1 }, name: 'idx_gb_participants' },
  ],

  // -- Users
  users: [
    { key: { user_id: 1 }, name: 'idx_users_userid', unique: true },
  ],

  // -- Children
  children: [
    { key: { user_id: 1 }, name: 'idx_children_userid' },
  ],

  // -- Training Blocks (legacy)
  trainingBlocks: [
    { key: { blockId: 1 }, name: 'idx_tb_blockid', unique: true },
    { key: { blockType: 1, isActive: 1 }, name: 'idx_tb_type_active' },
    { key: { placeId: 1, blockType: 1, timeBucket: 1 }, name: 'idx_tb_place_type_time', sparse: true },
    { key: { validUntil: 1 }, name: 'idx_tb_ttl', expireAfterSeconds: 0 },
    { key: { qualityScore: -1 }, name: 'idx_tb_quality', sparse: true },
  ],
};

/**
 * Batch-create indexes for specified collections.
 *
 * @param db - MongoDB Db instance
 * @param collectionOverrides - logical name -> actual collection name mapping
 * @param onlyCollections - if specified, only process these collections
 */
export async function ensureAllIndexes(
  db: Db,
  collectionOverrides?: Record<string, string>,
  onlyCollections?: string[],
): Promise<void> {
  const entries = onlyCollections
    ? Object.entries(INDEXES).filter(([key]) => onlyCollections.includes(key))
    : Object.entries(INDEXES);

  for (const [logicalName, indexDefs] of entries) {
    const actualName = collectionOverrides?.[logicalName] ?? logicalName;
    const collection = db.collection(actualName);

    for (const def of indexDefs) {
      try {
        const options: CreateIndexesOptions = { name: def.name };
        if (def.unique) options.unique = true;
        if (def.sparse) options.sparse = true;
        if (def.expireAfterSeconds !== undefined) {
          options.expireAfterSeconds = def.expireAfterSeconds;
        }
        await collection.createIndex(def.key, options);
      } catch {
        // createIndex is idempotent - same name = no-op,
        // different options = error (handle via migration script)
      }
    }
  }
}
