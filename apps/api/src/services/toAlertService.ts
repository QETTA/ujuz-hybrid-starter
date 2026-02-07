/**
 * UJUz - TO Alert Service
 * TO(자리) 알림 구독 및 감지
 */

import { getMongoDb, connectMongo } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

interface TOSubscriptionInput {
  user_id: string;
  facility_id: string;
  facility_name: string;
  target_classes: string[];
  notification_preferences: { push: boolean; sms: boolean; email: boolean };
}

interface TOSubscriptionDoc {
  id: string;
  user_id: string;
  facility_id: string;
  facility_name: string;
  target_classes: string[];
  is_active: boolean;
  notification_preferences: { push: boolean; sms: boolean; email: boolean };
  created_at: string;
}

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

export async function createSubscription(input: TOSubscriptionInput): Promise<TOSubscriptionDoc> {
  const db = await getDbOrThrow();
  const collection = db.collection('to_subscriptions');

  // Check if already subscribed
  const existing = await collection.findOne({
    user_id: input.user_id,
    facility_id: input.facility_id,
    is_active: true,
  });

  if (existing) {
    // Update existing
    await collection.updateOne(
      { _id: existing._id },
      { $set: { target_classes: input.target_classes, notification_preferences: input.notification_preferences } }
    );
    return {
      id: existing._id.toString(),
      ...input,
      is_active: true,
      created_at: (existing.created_at as Date).toISOString(),
    };
  }

  const doc = {
    ...input,
    is_active: true,
    created_at: new Date(),
  };

  const result = await collection.insertOne(doc);

  return {
    id: result.insertedId.toString(),
    ...input,
    is_active: true,
    created_at: doc.created_at.toISOString(),
  };
}

export async function getUserSubscriptions(userId: string): Promise<{ subscriptions: TOSubscriptionDoc[] }> {
  const db = await getDbOrThrow();
  const docs = await db.collection('to_subscriptions')
    .find({ user_id: userId, is_active: true })
    .sort({ created_at: -1 })
    .toArray();

  return {
    subscriptions: docs.map((doc) => ({
      id: doc._id.toString(),
      user_id: doc.user_id as string,
      facility_id: doc.facility_id as string,
      facility_name: doc.facility_name as string,
      target_classes: doc.target_classes as string[],
      is_active: doc.is_active as boolean,
      notification_preferences: doc.notification_preferences as { push: boolean; sms: boolean; email: boolean },
      created_at: (doc.created_at as Date).toISOString(),
    })),
  };
}

export async function deleteSubscription(userId: string, facilityId: string): Promise<void> {
  const db = await getDbOrThrow();
  await db.collection('to_subscriptions').updateOne(
    { user_id: userId, facility_id: facilityId },
    { $set: { is_active: false } }
  );
}

export async function getAlertHistory(userId: string): Promise<{
  alerts: Array<{
    id: string;
    facility_id: string;
    facility_name: string;
    age_class: string;
    detected_at: string;
    estimated_slots: number;
    confidence: number;
    is_read: boolean;
    source: string;
  }>;
  total: number;
  unread_count: number;
}> {
  const db = await getDbOrThrow();

  // Get user's subscribed facility IDs
  const subs = await db.collection('to_subscriptions')
    .find({ user_id: userId, is_active: true })
    .toArray();

  const facilityIds = subs.map((s) => s.facility_id as string);

  if (facilityIds.length === 0) {
    return { alerts: [], total: 0, unread_count: 0 };
  }

  const alerts = await db.collection('to_alerts')
    .find({ facility_id: { $in: facilityIds } })
    .sort({ detected_at: -1 })
    .limit(50)
    .toArray();

  const mapped = alerts.map((a) => ({
    id: a._id.toString(),
    facility_id: a.facility_id as string,
    facility_name: a.facility_name as string,
    age_class: a.age_class as string,
    detected_at: (a.detected_at as Date).toISOString(),
    estimated_slots: (a.estimated_slots as number) ?? 1,
    confidence: (a.confidence as number) ?? 0.6,
    is_read: (a.is_read as boolean) ?? false,
    source: (a.source as string) ?? 'auto_detection',
  }));

  return {
    alerts: mapped,
    total: mapped.length,
    unread_count: mapped.filter((a) => !a.is_read).length,
  };
}
