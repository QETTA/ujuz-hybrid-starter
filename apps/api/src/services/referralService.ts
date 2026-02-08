import { z } from 'zod';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';
import { getDbOrThrow } from './partnerDb.js';

export const ReferralEventTypeSchema = z.enum(['INSTALL', 'SIGNUP', 'SUBSCRIBE', 'DEAL_PURCHASE']);
export type ReferralEventType = z.infer<typeof ReferralEventTypeSchema>;

export interface TrackReferralEventInput {
  code: string;
  type: ReferralEventType;
  user_id?: string;
  device_id?: string;
  amount?: number;
  currency?: string;
  meta?: Record<string, unknown>;
}

export function monthRange(period: string): { start: Date; endExclusive: Date } {
  // period: YYYY-MM
  const m = /^\d{4}-\d{2}$/.exec(period);
  if (!m) throw new AppError('Invalid period format. Use YYYY-MM', 400, 'invalid_period');
  const [y, mo] = period.split('-').map((x) => Number(x));
  const start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(y, mo, 1, 0, 0, 0));
  return { start, endExclusive };
}

/**
 * Validates code, stores event, and (for INSTALL/SIGNUP) writes attribution window.
 */
export async function trackReferralEvent(input: TrackReferralEventInput) {
  const db = await getDbOrThrow();

  const link = await db.collection('referral_links').findOne({ code: input.code, is_active: true });
  if (!link) {
    throw new AppError('Referral code not found', 404, 'referral_code_not_found');
  }

  const now = new Date();
  await db.collection('referral_events').insertOne({
    code: input.code,
    type: input.type,
    user_id: input.user_id,
    device_id: input.device_id,
    amount: input.amount,
    currency: input.currency ?? 'KRW',
    meta: input.meta,
    created_at: now,
  });

  if (input.type === 'INSTALL' || input.type === 'SIGNUP') {
    const attributionDays = env.REFERRAL_ATTRIBUTION_DAYS ?? 14;
    const expiresAt = new Date(now.getTime() + attributionDays * 24 * 60 * 60 * 1000);

    const baseDoc = {
      code: input.code,
      expires_at: expiresAt,
      updated_at: now,
      created_at: now,
    };

    // Prefer user_id, fallback to device_id
    if (input.user_id) {
      await db.collection('referral_attributions').updateOne(
        { user_id: input.user_id },
        { $set: { ...baseDoc, user_id: input.user_id }, $setOnInsert: { created_at: now } },
        { upsert: true },
      );
    } else if (input.device_id) {
      await db.collection('referral_attributions').updateOne(
        { device_id: input.device_id },
        { $set: { ...baseDoc, device_id: input.device_id }, $setOnInsert: { created_at: now } },
        { upsert: true },
      );
    }
  }

  return { ok: true, code: input.code };
}

/**
 * Settlement preview/run:
 * - aggregates SUBSCRIBE/DEAL_PURCHASE events by cafe_id via referral_links
 * - computes shares using partner_cafes share rates
 */
export async function computeSettlement(period: string, persist: boolean) {
  const db = await getDbOrThrow();
  const { start, endExclusive } = monthRange(period);

  const pipeline = [
    { $match: { created_at: { $gte: start, $lt: endExclusive }, type: { $in: ['SUBSCRIBE', 'DEAL_PURCHASE'] } } },
    { $lookup: { from: 'referral_links', localField: 'code', foreignField: 'code', as: 'link' } },
    { $unwind: '$link' },
    { $lookup: { from: 'partner_cafes', localField: 'link.cafe_id', foreignField: 'cafe_id', as: 'cafe' } },
    { $unwind: '$cafe' },
    {
      $group: {
        _id: '$cafe.cafe_id',
        cafe_name: { $first: '$cafe.name' },
        share_rate_subscription: { $first: { $ifNull: ['$cafe.share_rate_subscription', 0] } },
        share_rate_commerce: { $first: { $ifNull: ['$cafe.share_rate_commerce', 0] } },
        gross_subscription: {
          $sum: { $cond: [{ $eq: ['$type', 'SUBSCRIBE'] }, { $ifNull: ['$amount', 0] }, 0] },
        },
        gross_commerce: {
          $sum: { $cond: [{ $eq: ['$type', 'DEAL_PURCHASE'] }, { $ifNull: ['$amount', 0] }, 0] },
        },
        event_count: { $sum: 1 },
      },
    },
    { $sort: { gross_subscription: -1, gross_commerce: -1 } },
  ];

  const rows = await db.collection('referral_events').aggregate(pipeline).toArray();

  const now = new Date();
  const ledgers = rows.map((r) => {
    const shareSub = Math.round((r.gross_subscription ?? 0) * (r.share_rate_subscription ?? 0));
    const shareCom = Math.round((r.gross_commerce ?? 0) * (r.share_rate_commerce ?? 0));
    return {
      cafe_id: r._id,
      cafe_name: r.cafe_name,
      period,
      gross_subscription: r.gross_subscription ?? 0,
      gross_commerce: r.gross_commerce ?? 0,
      share_rate_subscription: r.share_rate_subscription ?? 0,
      share_rate_commerce: r.share_rate_commerce ?? 0,
      share_subscription: shareSub,
      share_commerce: shareCom,
      event_count: r.event_count ?? 0,
      updated_at: now,
      created_at: now,
    };
  });

  if (persist) {
    // Use bulkWrite instead of sequential updateOne
    const bulkOps = ledgers.map((l) => ({
      updateOne: {
        filter: { cafe_id: l.cafe_id, period: l.period },
        update: {
          $set: {
            cafe_name: l.cafe_name,
            gross_subscription: l.gross_subscription,
            gross_commerce: l.gross_commerce,
            share_rate_subscription: l.share_rate_subscription,
            share_rate_commerce: l.share_rate_commerce,
            share_subscription: l.share_subscription,
            share_commerce: l.share_commerce,
            event_count: l.event_count,
            updated_at: now,
          },
          $setOnInsert: { created_at: now },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await db.collection('payout_ledgers').bulkWrite(bulkOps, { ordered: false });
    }
  }

  return { period, start, endExclusive, ledgers };
}
