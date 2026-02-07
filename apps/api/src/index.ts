import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { prisma } from '@ujuz/db';
import { authMiddleware, requireAuth, signToken } from './auth.js';
import { alertsQueue, aiQueue } from './queues.js';
import { enforceAlertLimit, enforceAiQuota, getUserPlan } from './entitlements.js';
import { PostType } from '@prisma/client';
import partnersRouter from './routes/partners.js';
import referralsRouter from './routes/referrals.js';
import widgetsRouter from './routes/widgets.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(authMiddleware);

// --- Partner / Referrals / Widgets
app.use('/v1/partners', partnersRouter);
app.use('/v1/referrals', referralsRouter);
app.use('/v1/widgets', widgetsRouter);


app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// --- Auth (DEV only)
app.post('/v1/auth/dev-login', async (req, res) => {
  const body = z.object({ email: z.string().email().optional(), handle: z.string().min(2).max(30).optional() }).parse(req.body ?? {});

  const where = body.email ? { email: body.email } : body.handle ? { handle: body.handle } : null;
  if (!where) return res.status(400).json({ error: 'email 또는 handle 필요' });

  let user = await prisma.user.findFirst({ where });
  if (!user) {
    user = await prisma.user.create({ data: { email: body.email, handle: body.handle } });
  }
  const token = signToken(user.id);
  res.json({ token, user });
});

// --- Onboarding
app.post('/v1/onboarding', requireAuth, async (req, res) => {
  const body = z.object({
    neighborhoodId: z.string().min(1),
    childBirthYear: z.number().int().min(2000).max(2100).optional(),
    stage: z.string().max(20).optional()
  }).parse(req.body ?? {});

  await prisma.membership.upsert({
    where: { userId_neighborhoodId: { userId: req.userId!, neighborhoodId: body.neighborhoodId } },
    update: {},
    create: { userId: req.userId!, neighborhoodId: body.neighborhoodId }
  });

  if (body.childBirthYear) {
    await prisma.childProfile.create({
      data: { userId: req.userId!, birthYear: body.childBirthYear, stage: body.stage }
    });
  }

  res.json({ ok: true });
});

// --- Feed
app.get('/v1/feed', requireAuth, async (req, res) => {
  const tab = z.enum(['neighborhood', 'cohort', 'best']).parse(String(req.query.tab ?? 'neighborhood'));
  const take = z.coerce.number().int().min(1).max(50).default(20).parse(req.query.take);

  let where: any = {};
  if (tab === 'neighborhood') {
    const membership = await prisma.membership.findFirst({ where: { userId: req.userId! }, orderBy: { createdAt: 'desc' } });
    where = { neighborhoodId: membership?.neighborhoodId ?? undefined };
  } else if (tab === 'cohort') {
    const child = await prisma.childProfile.findFirst({ where: { userId: req.userId! }, orderBy: { createdAt: 'desc' } });
    where = { cohortYear: child?.birthYear ?? undefined };
  } else {
    // best: 간단히 최근 7일 + reactions count 기준 정렬(현재는 createdAt desc)
    where = {};
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      user: { select: { id: true, handle: true } },
      _count: { select: { comments: true, reactions: true } },
      place: true
    }
  });

  res.json({ tab, posts });
});

// --- Posts
app.post('/v1/posts', requireAuth, async (req, res) => {
  const body = z.object({
    type: z.nativeEnum(PostType),
    title: z.string().min(2).max(120),
    body: z.string().min(1).max(5000),
    neighborhoodId: z.string().min(1).optional(),
    cohortYear: z.number().int().optional(),
    placeId: z.string().min(1).optional()
  }).parse(req.body ?? {});

  const membership = await prisma.membership.findFirst({ where: { userId: req.userId! }, orderBy: { createdAt: 'desc' } });
  const child = await prisma.childProfile.findFirst({ where: { userId: req.userId! }, orderBy: { createdAt: 'desc' } });

  const post = await prisma.post.create({
    data: {
      userId: req.userId!,
      type: body.type,
      title: body.title,
      body: body.body,
      neighborhoodId: body.neighborhoodId ?? membership?.neighborhoodId ?? null,
      cohortYear: body.cohortYear ?? child?.birthYear ?? null,
      placeId: body.placeId ?? null
    },
    include: { user: { select: { id: true, handle: true } } }
  });

  // Alert event 생성 + 큐 enqueue
  const event = await prisma.alertEvent.create({
    data: { postId: post.id, kind: 'post.created' }
  });
  await alertsQueue.add('post.created', { eventId: event.id });

  res.json({ post });
});

app.get('/v1/posts/:id', requireAuth, async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, handle: true } },
      comments: { include: { user: { select: { id: true, handle: true } } }, orderBy: { createdAt: 'asc' } },
      _count: { select: { reactions: true, comments: true } },
      place: true
    }
  });
  if (!post) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ post });
});

app.post('/v1/posts/:id/comments', requireAuth, async (req, res) => {
  const postId = z.string().min(1).parse(req.params.id);
  const body = z.object({ body: z.string().min(1).max(2000) }).parse(req.body ?? {});
  const comment = await prisma.comment.create({
    data: { postId, userId: req.userId!, body: body.body },
    include: { user: { select: { id: true, handle: true } } }
  });
  res.json({ comment });
});

// --- Places / Reviews
app.post('/v1/places', requireAuth, async (req, res) => {
  const body = z.object({
    neighborhoodId: z.string().min(1),
    name: z.string().min(1).max(120),
    category: z.string().min(1).max(40),
    address: z.string().max(200).optional()
  }).parse(req.body ?? {});

  const place = await prisma.place.upsert({
    where: { neighborhoodId_name: { neighborhoodId: body.neighborhoodId, name: body.name } },
    update: { category: body.category, address: body.address },
    create: { neighborhoodId: body.neighborhoodId, name: body.name, category: body.category, address: body.address }
  });

  res.json({ place });
});

app.get('/v1/places', requireAuth, async (req, res) => {
  const neighborhoodId = z.string().optional().parse(req.query.neighborhoodId);
  const category = z.string().optional().parse(req.query.category);

  const where: any = {};
  if (neighborhoodId) where.neighborhoodId = neighborhoodId;
  if (category) where.category = category;

  const places = await prisma.place.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { _count: { select: { reviews: true } } }
  });
  res.json({ places });
});

app.post('/v1/places/:id/reviews', requireAuth, async (req, res) => {
  const placeId = z.string().min(1).parse(req.params.id);
  const body = z.object({
    summary: z.string().min(1).max(200),
    tags: z.array(z.string().min(1).max(30)).max(20),
    content: z.string().max(3000).optional()
  }).parse(req.body ?? {});

  const review = await prisma.placeReview.create({
    data: { placeId, userId: req.userId!, summary: body.summary, tags: body.tags, content: body.content }
  });
  res.json({ review });
});

// --- Bookmarks
app.post('/v1/bookmarks', requireAuth, async (req, res) => {
  const body = z.object({ postId: z.string().optional(), placeId: z.string().optional() }).parse(req.body ?? {});
  if (!body.postId && !body.placeId) return res.status(400).json({ error: 'postId 또는 placeId 필요' });

  const bookmark = await prisma.bookmark.create({
    data: { userId: req.userId!, postId: body.postId, placeId: body.placeId }
  });
  res.json({ bookmark });
});

app.get('/v1/bookmarks', requireAuth, async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    include: { post: true, place: true }
  });
  res.json({ bookmarks });
});

// --- Alert rules
app.post('/v1/alerts', requireAuth, async (req, res) => {
  const body = z.object({
    neighborhoodId: z.string().optional(),
    cohortYear: z.number().int().optional(),
    keywords: z.array(z.string().min(1).max(40)).max(20).default([]),
    categories: z.array(z.string().min(1).max(40)).max(20).default([]),
    frequency: z.enum(['INSTANT', 'DAILY_DIGEST']).default('INSTANT')
  }).parse(req.body ?? {});

  try {
    await enforceAlertLimit(req.userId!);
  } catch (e: any) {
    if (e?.code === 'ALERT_LIMIT_REACHED') {
      return res.status(402).json({ error: e.code, ...e.meta });
    }
    throw e;
  }

  const rule = await prisma.alertRule.create({
    data: {
      userId: req.userId!,
      neighborhoodId: body.neighborhoodId ?? null,
      cohortYear: body.cohortYear ?? null,
      keywords: body.keywords,
      categories: body.categories,
      frequency: body.frequency,
      isActive: true
    }
  });

  res.json({ rule });
});

app.get('/v1/alerts', requireAuth, async (req, res) => {
  const rules = await prisma.alertRule.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' }
  });
  const plan = await getUserPlan(req.userId!);
  res.json({ plan, rules });
});

// --- Notifications
app.get('/v1/notifications', requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ notifications });
});

app.post('/v1/notifications/:id/read', requireAuth, async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);
  await prisma.notification.updateMany({ where: { id, userId: req.userId! }, data: { isRead: true } });
  res.json({ ok: true });
});

// --- AI Jobs
app.post('/v1/ai/jobs', requireAuth, async (req, res) => {
  const body = z.object({
    type: z.enum(['inquiry_message', 'compare_table']),
    input: z.record(z.any())
  }).parse(req.body ?? {});

  try {
    await enforceAiQuota(req.userId!);
  } catch (e: any) {
    if (e?.code === 'AI_QUOTA_REACHED') {
      return res.status(402).json({ error: e.code, ...e.meta });
    }
    throw e;
  }

  const job = await prisma.aiJob.create({
    data: { userId: req.userId!, type: body.type, input: body.input, status: 'QUEUED' }
  });

  await aiQueue.add(body.type, { aiJobId: job.id });
  res.json({ job });
});

app.get('/v1/ai/jobs/:id', requireAuth, async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);
  const job = await prisma.aiJob.findFirst({ where: { id, userId: req.userId! } });
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ job });
});

// --- Billing (MVP Stub)
app.get('/v1/billing/plans', async (_req, res) => {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
  res.json({ plans });
});

app.post('/v1/billing/mock-subscribe', requireAuth, async (req, res) => {
  const body = z.object({ tier: z.enum(['BASIC', 'PRO', 'FAMILY']) }).parse(req.body ?? {});
  const sub = await prisma.subscription.upsert({
    where: { userId: req.userId! },
    update: { tier: body.tier, status: 'ACTIVE' },
    create: { userId: req.userId!, tier: body.tier, status: 'ACTIVE' }
  });
  res.json({ sub });
});

// --- Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL', message: err?.message });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`✅ API listening on http://localhost:${port}`);
});