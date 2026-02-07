import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { requireAdminKey } from '../middleware/adminKeyAuth.js';
import { requirePartnerOrg } from '../middleware/partnerAuth.js';
import {
  PartnerOrgTypeSchema,
  PartnerCafePlatformSchema,
  batchExternalPosts,
  createPartnerCafe,
  createPartnerOrg,
  createReferralLink,
  createWidget,
  issuePartnerApiKey,
} from '../services/partnerService.js';
import { computeSettlement } from '../services/referralService.js';
import { getDbOrThrow } from '../services/partnerDb.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Admin routes (protected by x-admin-key)
// ─────────────────────────────────────────────────────────────

const CreateOrgSchema = z.object({
  name: z.string().min(2),
  org_type: PartnerOrgTypeSchema.default('other'),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
});

router.post('/orgs', requireAdminKey, async (req, res) => {
  const body = CreateOrgSchema.parse(req.body);
  const data = await createPartnerOrg(body);
  res.json({ ok: true, data });
});

const CreateCafeSchema = z.object({
  org_id: z.string().min(3),
  platform: PartnerCafePlatformSchema.default('etc'),
  platform_cafe_id: z.string().optional(),
  name: z.string().min(2),
  url: z.string().url().optional(),
  region: z.string().optional(),
  share_rate_subscription: z.number().min(0).max(1).optional(),
  share_rate_commerce: z.number().min(0).max(1).optional(),
});

router.post('/cafes', requireAdminKey, async (req, res) => {
  const body = CreateCafeSchema.parse(req.body);
  const data = await createPartnerCafe(body);
  res.json({ ok: true, data });
});

const IssueKeySchema = z.object({
  name: z.string().optional(),
});

router.post('/orgs/:orgId/api-keys', requireAdminKey, async (req, res) => {
  const org_id = z.string().min(3).parse(req.params.orgId);
  const body = IssueKeySchema.parse(req.body);
  const data = await issuePartnerApiKey({ org_id, name: body.name });
  // rawKey is shown ONCE; do not log
  res.json({ ok: true, data });
});

const CreateReferralLinkSchema = z.object({
  channel: z.string().optional(),
  landing_path: z.string().optional(),
});

router.post('/cafes/:cafeId/referral-links', requireAdminKey, async (req, res) => {
  const cafe_id = z.string().min(3).parse(req.params.cafeId);
  const body = CreateReferralLinkSchema.parse(req.body);
  const data = await createReferralLink({ cafe_id, channel: body.channel, landing_path: body.landing_path });
  res.json({ ok: true, data });
});

const CreateWidgetSchema = z.object({
  type: z.string().optional(),
  config: z.record(z.any()).optional(),
});

router.post('/cafes/:cafeId/widgets', requireAdminKey, async (req, res) => {
  const cafe_id = z.string().min(3).parse(req.params.cafeId);
  const body = CreateWidgetSchema.parse(req.body);
  const data = await createWidget({ cafe_id, type: body.type, config: body.config });
  res.json({ ok: true, data });
});

router.get('/payouts/preview', requireAdminKey, async (req, res) => {
  const period = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.period);
  const data = await computeSettlement(period, false);
  res.json({ ok: true, data });
});

router.post('/payouts/run', requireAdminKey, async (req, res) => {
  const body = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
  const data = await computeSettlement(body.period, true);
  res.json({ ok: true, data });
});

// ─────────────────────────────────────────────────────────────
// Partner routes (protected by x-partner-key)
// ─────────────────────────────────────────────────────────────

router.get('/me/cafes', requirePartnerOrg, async (req, res) => {
  const org_id = (req as any).partnerOrgId as string;
  const db = await getDbOrThrow();
  const cafes = await db.collection('partner_cafes').find({ org_id }).sort({ created_at: -1 }).toArray();
  res.json({
    ok: true,
    data: cafes.map((c: any) => ({
      cafe_id: c.cafe_id,
      name: c.name,
      platform: c.platform,
      url: c.url,
      status: c.status,
      share_rate_subscription: c.share_rate_subscription,
      share_rate_commerce: c.share_rate_commerce,
    })),
  });
});

const ExternalPostSchema = z.object({
  external_id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  url: z.string().url().optional(),
  posted_at: z.string().datetime().optional(),
  author_hash: z.string().optional(),
  raw: z.record(z.any()).optional(),
  facility_id: z.string().optional(),
  facility_name: z.string().optional(),
});

const BatchExternalPostsSchema = z.object({
  posts: z.array(ExternalPostSchema).min(1).max(200),
});

router.post(
  '/cafes/:cafeId/external-posts/batch',
  requirePartnerOrg,
  createRateLimiter({ windowMs: 60_000, max: 60 }), // per partner key
  async (req, res) => {
    const org_id = (req as any).partnerOrgId as string;
    const cafe_id = z.string().min(3).parse(req.params.cafeId);
    const body = BatchExternalPostsSchema.parse(req.body);

    const data = await batchExternalPosts({ org_id, cafe_id, posts: body.posts });
    res.json({ ok: true, data });
  },
);

export default router;
