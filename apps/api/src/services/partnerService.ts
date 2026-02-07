import { z } from 'zod';
import { AppError } from '@ujuz/shared';
import { getDbOrThrow } from './partnerDb.js';
import { hashPartnerKey, randomCode } from '@ujuz/shared';

export const PartnerOrgTypeSchema = z.enum(['momcafe', 'blogger', 'media', 'other']);
export type PartnerOrgType = z.infer<typeof PartnerOrgTypeSchema>;

export const PartnerCafePlatformSchema = z.enum(['naver_cafe', 'daum_cafe', 'etc']);
export type PartnerCafePlatform = z.infer<typeof PartnerCafePlatformSchema>;

export interface CreatePartnerOrgInput {
  name: string;
  org_type: PartnerOrgType;
  contact_name?: string;
  contact_email?: string;
}

export interface CreatePartnerCafeInput {
  org_id: string;
  platform: PartnerCafePlatform;
  platform_cafe_id?: string;
  name: string;
  url?: string;
  region?: string;
  share_rate_subscription?: number; // 0..1
  share_rate_commerce?: number; // 0..1
}

export interface CreateReferralLinkInput {
  cafe_id: string;
  channel?: string;
  landing_path?: string;
}

export interface CreateWidgetInput {
  cafe_id: string;
  type?: string; // e.g. to_alerts
  config?: Record<string, unknown>;
}

export interface IssueApiKeyInput {
  org_id: string;
  name?: string;
}

export interface ExternalPostInput {
  external_id: string;
  title: string;
  body?: string;
  url?: string;
  posted_at?: string; // ISO
  author_hash?: string;
  raw?: Record<string, unknown>;
  facility_id?: string;
  facility_name?: string;
}

const TO_KEYWORDS = [
  /\bTO\b/i,
  /\ud2f0\uc624/,
  /\uc785\uc18c/,
  /\uacb0\uc6d0/,
  /\uc790\ub9ac/,
  /\ub300\uae30\s*0\s*\ubc88/,
];

const WAITLIST_RE = /\ub300\uae30\s*(\d+)\s*\ubc88/;
const SLOT_RE = /(TO|\uc785\uc18c|\uacb0\uc6d0|\uc790\ub9ac)\s*(\d+)\s*(\uba85|\uac1c)?/i;
const AGE_RE = /(\ub9cc\s*)?(\d)\s*\uc138/;

function detectTo(text: string): { toMention: boolean; confidence: number; extracted?: Record<string, unknown> } {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const hasKeyword = TO_KEYWORDS.some((re) => re.test(normalized));
  if (!hasKeyword) return { toMention: false, confidence: 0 };

  let confidence = 0.55;
  const extracted: Record<string, unknown> = {};

  const slotMatch = normalized.match(SLOT_RE);
  if (slotMatch) {
    const n = Number(slotMatch[2]);
    if (Number.isFinite(n)) {
      extracted.estimated_slots = n;
      confidence = 0.85;
    }
  }

  const waitMatch = normalized.match(WAITLIST_RE);
  if (waitMatch) {
    extracted.waiting_position = Number(waitMatch[1]);
    confidence = Math.max(confidence, 0.7);
  }

  const ageMatch = normalized.match(AGE_RE);
  if (ageMatch) {
    extracted.age_class = `${ageMatch[2]}\uc138`;
    confidence = Math.max(confidence, 0.7);
  }

  if (!extracted.estimated_slots && extracted.waiting_position === 0) {
    extracted.estimated_slots = 1;
  }
  if (!extracted.estimated_slots && hasKeyword) {
    extracted.estimated_slots = 1;
  }

  return { toMention: true, confidence, extracted };
}

export async function createPartnerOrg(input: CreatePartnerOrgInput) {
  const db = await getDbOrThrow();
  const now = new Date();

  const org_id = randomCode('org');
  await db.collection('partner_orgs').insertOne({
    org_id,
    name: input.name,
    org_type: input.org_type,
    contact_name: input.contact_name,
    contact_email: input.contact_email,
    status: 'active',
    created_at: now,
  });

  return { org_id };
}

export async function createPartnerCafe(input: CreatePartnerCafeInput) {
  const db = await getDbOrThrow();
  const now = new Date();

  const org = await db.collection('partner_orgs').findOne({ org_id: input.org_id });
  if (!org) throw new AppError('Partner org not found', 404, 'partner_org_not_found');

  const cafe_id = randomCode('cafe');
  await db.collection('partner_cafes').insertOne({
    cafe_id,
    org_id: input.org_id,
    platform: input.platform,
    platform_cafe_id: input.platform_cafe_id,
    name: input.name,
    url: input.url,
    region: input.region,
    share_rate_subscription: input.share_rate_subscription ?? 0,
    share_rate_commerce: input.share_rate_commerce ?? 0,
    status: 'active',
    created_at: now,
  });

  return { cafe_id };
}

export async function issuePartnerApiKey(input: IssueApiKeyInput) {
  const db = await getDbOrThrow();
  const now = new Date();

  const org = await db.collection('partner_orgs').findOne({ org_id: input.org_id });
  if (!org) throw new AppError('Partner org not found', 404, 'partner_org_not_found');

  const key_id = randomCode('pkey');
  const rawKey = randomCode('pk'); // shown ONCE
  const key_hash = hashPartnerKey(rawKey);

  await db.collection('partner_api_keys').insertOne({
    key_id,
    org_id: input.org_id,
    name: input.name ?? 'default',
    key_hash,
    created_at: now,
  });

  return { key_id, rawKey };
}

export async function createReferralLink(input: CreateReferralLinkInput) {
  const db = await getDbOrThrow();
  const now = new Date();

  const cafe = await db.collection('partner_cafes').findOne({ cafe_id: input.cafe_id });
  if (!cafe) throw new AppError('Cafe not found', 404, 'cafe_not_found');

  const code = randomCode('ref');
  await db.collection('referral_links').insertOne({
    link_id: randomCode('link'),
    cafe_id: input.cafe_id,
    code,
    channel: input.channel,
    landing_path: input.landing_path ?? '/ujuz',
    is_active: true,
    created_at: now,
  });

  return { code };
}

export async function createWidget(input: CreateWidgetInput) {
  const db = await getDbOrThrow();
  const now = new Date();

  const cafe = await db.collection('partner_cafes').findOne({ cafe_id: input.cafe_id });
  if (!cafe) throw new AppError('Cafe not found', 404, 'cafe_not_found');

  const widget_key = randomCode('w');
  await db.collection('partner_widgets').insertOne({
    widget_id: randomCode('widget'),
    cafe_id: input.cafe_id,
    type: input.type ?? 'to_alerts',
    widget_key,
    config: input.config ?? {},
    is_active: true,
    created_at: now,
  });

  return { widget_key };
}

export async function batchExternalPosts(params: { cafe_id: string; org_id: string; posts: ExternalPostInput[] }) {
  const db = await getDbOrThrow();

  const cafe = await db.collection('partner_cafes').findOne({ cafe_id: params.cafe_id, org_id: params.org_id });
  if (!cafe) throw new AppError('Cafe not found for this org', 404, 'cafe_not_found');

  const now = new Date();
  let created = 0;
  let updated = 0;
  let detectionsCreated = 0;
  let alertsCreated = 0;

  for (const p of params.posts) {
    const text = `${p.title}\n${p.body ?? ''}`;
    const det = detectTo(text);

    const postedAt = p.posted_at ? new Date(p.posted_at) : now;
    const doc = {
      cafe_id: params.cafe_id,
      org_id: params.org_id,
      external_id: p.external_id,
      title: p.title,
      body: p.body,
      url: p.url,
      posted_at: postedAt,
      author_hash: p.author_hash,
      raw: p.raw,
      to_mention: det.toMention,
      to_confidence: det.confidence,
      to_extracted: det.extracted,
      facility_id: p.facility_id,
      facility_name: p.facility_name,
      updated_at: now,
      created_at: now,
    };

    const result = await db.collection('external_posts').updateOne(
      { cafe_id: params.cafe_id, external_id: p.external_id },
      { $set: doc, $setOnInsert: { created_at: now } },
      { upsert: true },
    );

    if (result.upsertedCount === 1) created += 1;
    else if (result.modifiedCount === 1) updated += 1;

    const externalPostId = result.upsertedId
      ? result.upsertedId
      : (await db.collection('external_posts').findOne({ cafe_id: params.cafe_id, external_id: p.external_id }, { projection: { _id: 1 } }))?._id;

    // If TO mention detected, store a detection record (idempotent per post)
    if (det.toMention && externalPostId) {
      try {
        await db.collection('to_detections').insertOne({
          external_post_id: externalPostId,
          cafe_id: params.cafe_id,
          org_id: params.org_id,
          detected_at: postedAt,
          title: p.title,
          url: p.url,
          extracted: det.extracted,
          confidence: det.confidence,
          created_at: now,
        });
        detectionsCreated += 1;
      } catch {
        // likely duplicate (unique index on external_post_id)
      }
    }

    // Optional: if facility_id is provided, immediately create a TO alert for subscribed users
    if (det.toMention && p.facility_id) {
      try {
        await db.collection('to_alerts').insertOne({
          facility_id: p.facility_id,
          facility_name: p.facility_name,
          detected_at: postedAt,
          source: 'community_report',
          confidence: det.confidence,
          estimated_slots: det.extracted?.estimated_slots,
          age_class: det.extracted?.age_class,
          details: {
            external_post: {
              cafe_id: params.cafe_id,
              external_id: p.external_id,
              url: p.url,
            },
            extracted: det.extracted,
          },
          created_at: now,
        });
        alertsCreated += 1;
      } catch {
        // ignore duplicates / validation
      }
    }
  }

  return { ok: true, created, updated, detectionsCreated, alertsCreated };
}

export async function getWidgetByKey(widget_key: string) {
  const db = await getDbOrThrow();
  const widget = await db.collection('partner_widgets').findOne({ widget_key, is_active: true });
  if (!widget) throw new AppError('Widget not found', 404, 'widget_not_found');

  const cafe = await db.collection('partner_cafes').findOne({ cafe_id: widget.cafe_id });
  const latestReferral = await db
    .collection('referral_links')
    .find({ cafe_id: widget.cafe_id, is_active: true })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();

  const posts = await db
    .collection('external_posts')
    .find({ cafe_id: widget.cafe_id, to_mention: true })
    .sort({ posted_at: -1 })
    .limit(20)
    .toArray();

  return {
    widget: {
      widget_key,
      cafe_id: widget.cafe_id,
      cafe_name: cafe?.name,
      type: widget.type,
      config: widget.config,
      referral_code: latestReferral[0]?.code,
    },
    to_mentions: posts.map((p) => ({
      external_id: p.external_id,
      title: p.title,
      url: p.url,
      posted_at: p.posted_at,
      confidence: p.to_confidence,
      extracted: p.to_extracted,
    })),
  };
}
