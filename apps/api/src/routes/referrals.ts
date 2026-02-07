import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@ujuz/db';

const router = Router();

const TrackBody = z.object({
  code: z.string().min(3).max(64),
  type: z.enum(['INSTALL', 'SIGNUP', 'SUBSCRIBE', 'DEAL_PURCHASE']),
  anonymousId: z.string().min(3).max(128).optional(),
  amount: z.number().int().nonnegative().optional(),
  currency: z.string().min(3).max(8).default('KRW').optional(),
  metadata: z.record(z.any()).optional()
});

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

router.post('/track', async (req, res) => {
  const body = TrackBody.parse(req.body ?? {});
  const days = Number(process.env.REFERRAL_COOKIE_DAYS ?? 30);

  const link = await prisma.referralLink.findUnique({ where: { code: body.code } });
  if (!link || !link.isActive) return res.status(404).json({ error: 'INVALID_CODE' });

  const userId = req.userId as string | undefined;

  // Create event
  await prisma.referralEvent.create({
    data: {
      code: body.code,
      userId: userId ?? null,
      anonymousId: body.anonymousId ?? null,
      type: body.type,
      amount: body.amount ?? null,
      currency: body.currency ?? 'KRW',
      metadata: body.metadata ?? null
    }
  });

  // Attribution: only for install/signup (first touch)
  if (body.type === 'INSTALL' || body.type === 'SIGNUP') {
    const now = new Date();
    const expiresAt = addDays(now, days);

    const existing = await prisma.referralAttribution.findFirst({
      where: {
        code: body.code,
        OR: [
          userId ? { userId } : undefined,
          body.anonymousId ? { anonymousId: body.anonymousId } : undefined
        ].filter(Boolean) as any
      }
    });

    if (existing) {
      await prisma.referralAttribution.update({
        where: { id: existing.id },
        data: {
          userId: userId ?? existing.userId,
          anonymousId: body.anonymousId ?? existing.anonymousId,
          expiresAt
        }
      });
    } else {
      await prisma.referralAttribution.create({
        data: {
          code: body.code,
          userId: userId ?? null,
          anonymousId: body.anonymousId ?? null,
          expiresAt
        }
      });
    }
  }

  res.json({ ok: true });
});

export default router;
