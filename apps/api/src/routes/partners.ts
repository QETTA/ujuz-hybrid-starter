import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@ujuz/db';
import { requireAdminKey } from '../admin.js';
import { sha256, randomCode } from '../utils/crypto.js';

const router = Router();

const CreateOrgBody = z.object({
  name: z.string().min(2).max(80),
  orgType: z.string().max(40).optional(),
  contactName: z.string().max(40).optional(),
  contactEmail: z.string().email().optional()
});

const CreateCafeBody = z.object({
  orgId: z.string().min(1),
  platform: z.enum(['NAVER_CAFE', 'KAKAO_OPENCHAT', 'BAND', 'OTHER']).default('NAVER_CAFE'),
  platformCafeId: z.string().max(80).optional(),
  name: z.string().min(2).max(80),
  url: z.string().url().optional(),
  region: z.string().max(80).optional(),
  shareRateSubscription: z.number().min(0).max(1).optional(),
  shareRateCommerce: z.number().min(0).max(1).optional()
});

const CreateReferralLinkBody = z.object({
  channel: z.string().max(40).optional(),
  landingPath: z.string().max(120).default('/install')
});

const CreateWidgetBody = z.object({
  type: z.enum(['TO_ALERT', 'ADMISSION_SCORE', 'DEALS', 'TRENDING', 'BOT']),
  config: z.record(z.any()).optional()
});

const BatchExternalPostsBody = z.object({
  posts: z.array(
    z.object({
      externalId: z.string().min(1).max(120),
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
      url: z.string().url().optional(),
      postedAt: z.string().datetime().optional(),
      authorHash: z.string().max(120).optional(),
      raw: z.record(z.any()).optional()
    })
  ).max(200)
});

function normalize(s: string) {
  return s.toLowerCase();
}

const TO_KEYWORDS = ['to', '자리', '빈자리', '결원', '추가모집', '충원', '입소', '대기', '모집'];

function detectTo(text: string) {
  const t = normalize(text);
  const hits = TO_KEYWORDS.filter((k) => t.includes(normalize(k)));
  let conf = 0.0;
  if (hits.includes('to')) conf += 0.3;
  if (hits.includes('결원') || hits.includes('빈자리')) conf += 0.3;
  if (hits.includes('추가모집') || hits.includes('충원') || hits.includes('모집')) conf += 0.2;
  if (hits.includes('대기') || hits.includes('입소')) conf += 0.1;
  conf = Math.min(0.95, conf);
  return { toMention: hits.length > 0, confidence: conf, hits };
}

function extractSignals(text: string) {
  const ageClass =
    text.match(/(만?\s*[0-5]\s*세\s*반?)/)?.[1] ??
    text.match(/([0-5]\s*세\s*반)/)?.[1] ??
    undefined;

  const waitingPosition = (() => {
    const m = text.match(/대기\s*(\d{1,4})\s*번/);
    return m ? Number(m[1]) : undefined;
  })();

  const estimatedSlots = (() => {
    const m = text.match(/(\d{1,2})\s*명\s*(?:결원|모집|추가)/);
    return m ? Number(m[1]) : undefined;
  })();

  return { ageClass, waitingPosition, estimatedSlots };
}

async function requirePartnerOrg(req: any, res: any, next: any) {
  const raw = req.header('x-partner-key');
  if (!raw) return res.status(401).json({ error: 'MISSING_PARTNER_KEY' });

  const keyHash = sha256(raw);
  const apiKey = await prisma.partnerApiKey.findFirst({ where: { keyHash, revokedAt: null } });
  if (!apiKey) return res.status(401).json({ error: 'INVALID_PARTNER_KEY' });

  req.partnerOrgId = apiKey.orgId;
  next();
}

// ───────────────────────────────────────────────────────────────
// Admin: partner onboarding
// ───────────────────────────────────────────────────────────────
router.post('/orgs', requireAdminKey, async (req, res) => {
  const body = CreateOrgBody.parse(req.body ?? {});
  const org = await prisma.partnerOrg.create({ data: body as any });
  res.json({ org });
});

router.post('/cafes', requireAdminKey, async (req, res) => {
  const body = CreateCafeBody.parse(req.body ?? {});
  const cafe = await prisma.partnerCafe.create({ data: body as any });
  res.json({ cafe });
});

router.post('/cafes/:cafeId/referral-links', requireAdminKey, async (req, res) => {
  const cafeId = z.string().min(1).parse(req.params.cafeId);
  const body = CreateReferralLinkBody.parse(req.body ?? {});
  const code = randomCode('ref');

  const link = await prisma.referralLink.create({
    data: { cafeId, code, channel: body.channel ?? null, landingPath: body.landingPath }
  });

  res.json({ link });
});

router.post('/cafes/:cafeId/widgets', requireAdminKey, async (req, res) => {
  const cafeId = z.string().min(1).parse(req.params.cafeId);
  const body = CreateWidgetBody.parse(req.body ?? {});
  const widgetKey = randomCode('widget');

  const widget = await prisma.partnerWidget.create({
    data: { cafeId, type: body.type, widgetKey, config: body.config ?? null }
  });

  res.json({ widget });
});

// Admin: payout preview/run
router.get('/payouts/preview', requireAdminKey, async (req, res) => {
  const period = z.string().regex(/^\d{4}-\d{2}$/).parse(String(req.query.period ?? ''));
  const result = await computePayout(period, false);
  res.json({ period, result });
});

router.post('/payouts/run', requireAdminKey, async (req, res) => {
  const body = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body ?? {});
  const result = await computePayout(body.period, true);
  res.json({ period: body.period, result });
});

async function computePayout(period: string, persist: boolean) {
  // period: YYYY-MM
  const [y, m] = period.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));

  // Load events within month
  const events = await prisma.referralEvent.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      type: { in: ['SUBSCRIBE', 'DEAL_PURCHASE'] }
    },
    include: { link: { include: { cafe: true } } }
  });

  // Aggregate by cafeId
  const map = new Map<string, any>();
  for (const e of events) {
    const cafe = (e as any).link?.cafe;
    if (!cafe) continue;

    const row = map.get(cafe.id) ?? {
      cafeId: cafe.id,
      cafeName: cafe.name,
      shareRateSubscription: cafe.shareRateSubscription,
      shareRateCommerce: cafe.shareRateCommerce,
      grossSubscription: 0,
      grossCommerce: 0
    };

    const amt = Number(e.amount ?? 0);
    if (e.type === 'SUBSCRIBE') row.grossSubscription += amt;
    if (e.type === 'DEAL_PURCHASE') row.grossCommerce += amt;

    map.set(cafe.id, row);
  }

  const rows = Array.from(map.values()).map((r) => ({
    ...r,
    shareSubscription: Math.floor(r.grossSubscription * r.shareRateSubscription),
    shareCommerce: Math.floor(r.grossCommerce * r.shareRateCommerce),
    totalShare: Math.floor(r.grossSubscription * r.shareRateSubscription) + Math.floor(r.grossCommerce * r.shareRateCommerce)
  }));

  if (persist) {
    for (const r of rows) {
      await prisma.payoutLedger.upsert({
        where: { cafeId_period: { cafeId: r.cafeId, period } },
        update: {
          grossSubscription: r.grossSubscription,
          grossCommerce: r.grossCommerce,
          shareSubscription: r.shareSubscription,
          shareCommerce: r.shareCommerce
        },
        create: {
          cafeId: r.cafeId,
          period,
          grossSubscription: r.grossSubscription,
          grossCommerce: r.grossCommerce,
          shareSubscription: r.shareSubscription,
          shareCommerce: r.shareCommerce
        }
      });
    }
  }

  return { rows, totals: {
    grossSubscription: rows.reduce((s, r) => s + r.grossSubscription, 0),
    grossCommerce: rows.reduce((s, r) => s + r.grossCommerce, 0),
    totalShare: rows.reduce((s, r) => s + r.totalShare, 0)
  }};
}

// ───────────────────────────────────────────────────────────────
// Partner: batch ingest external posts (opt-in feed)
// ───────────────────────────────────────────────────────────────
router.post('/cafes/:cafeId/external-posts:batch', requirePartnerOrg, async (req: any, res) => {
  const cafeId = z.string().min(1).parse(req.params.cafeId);
  const body = BatchExternalPostsBody.parse(req.body ?? {});

  const cafe = await prisma.partnerCafe.findFirst({ where: { id: cafeId, orgId: req.partnerOrgId, status: 'ACTIVE' } });
  if (!cafe) return res.status(404).json({ error: 'CAFE_NOT_FOUND' });

  let inserted = 0;
  let updated = 0;
  let toMentions = 0;

  for (const p of body.posts) {
    const text = `${p.title}\n${p.body}`;
    const det = detectTo(text);
    const signals = extractSignals(text);

    const postedAt = p.postedAt ? new Date(p.postedAt) : null;

    const existing = await prisma.externalPost.findUnique({
      where: { cafeId_externalId: { cafeId, externalId: p.externalId } }
    });

    if (existing) {
      await prisma.externalPost.update({
        where: { id: existing.id },
        data: {
          title: p.title,
          body: p.body,
          url: p.url ?? null,
          authorHash: p.authorHash ?? null,
          postedAt,
          raw: (p.raw as any) ?? null,
          toMention: det.toMention,
          toConfidence: det.confidence
        }
      });
      updated += 1;
    } else {
      const created = await prisma.externalPost.create({
        data: {
          cafeId,
          externalId: p.externalId,
          title: p.title,
          body: p.body,
          url: p.url ?? null,
          authorHash: p.authorHash ?? null,
          postedAt,
          raw: (p.raw as any) ?? null,
          toMention: det.toMention,
          toConfidence: det.confidence
        }
      });
      inserted += 1;

      if (det.toMention) {
        toMentions += 1;
        await prisma.toDetection.create({
          data: {
            externalPostId: created.id,
            ageClass: signals.ageClass ?? null,
            waitingPosition: signals.waitingPosition ?? null,
            estimatedSlots: signals.estimatedSlots ?? null,
            confidence: det.confidence,
            extracted: { hits: det.hits }
          }
        });
      }
    }
  }

  res.json({ ok: true, inserted, updated, toMentions });
});

// Admin: inspect detections
router.get('/cafes/:cafeId/to-detections', requireAdminKey, async (req, res) => {
  const cafeId = z.string().min(1).parse(req.params.cafeId);
  const list = await prisma.toDetection.findMany({
    where: { externalPost: { cafeId } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { externalPost: true }
  });
  res.json({ detections: list });
});

export default router;
