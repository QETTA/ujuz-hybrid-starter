/**
 * UJUz - GroupBuy Service
 */

import { ObjectId } from 'mongodb';
import { getMongoDb, connectMongo } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

const COLLECTION = 'group_buys';

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

interface GroupBuyDoc {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  item_type: string;
  ticket_id?: string;
  product_id?: string;
  goal_amount?: number;
  goal_quantity?: number;
  current_amount: number;
  current_quantity: number;
  achievement_rate: number;
  supporter_count: number;
  group_price?: number;
  regular_price?: number;
  max_discount_rate?: number;
  start_date: string;
  end_date: string;
  status: string;
  thumbnail_url?: string;
  tags?: string[];
  maker_name?: string;
  participants?: string[];
}

const mapDoc = (doc: Record<string, unknown>): GroupBuyDoc => ({
  id: (doc._id as ObjectId).toString(),
  title: doc.title as string,
  subtitle: doc.subtitle as string | undefined,
  description: doc.description as string | undefined,
  item_type: (doc.item_type as string) ?? 'product',
  ticket_id: doc.ticket_id as string | undefined,
  product_id: doc.product_id as string | undefined,
  goal_amount: doc.goal_amount as number | undefined,
  goal_quantity: doc.goal_quantity as number | undefined,
  current_amount: (doc.current_amount as number) ?? 0,
  current_quantity: (doc.current_quantity as number) ?? 0,
  achievement_rate: (doc.achievement_rate as number) ?? 0,
  supporter_count: (doc.supporter_count as number) ?? 0,
  group_price: doc.group_price as number | undefined,
  regular_price: doc.regular_price as number | undefined,
  max_discount_rate: doc.max_discount_rate as number | undefined,
  start_date: (doc.start_date as Date)?.toISOString?.() ?? (doc.start_date as string),
  end_date: (doc.end_date as Date)?.toISOString?.() ?? (doc.end_date as string),
  status: (doc.status as string) ?? 'active',
  thumbnail_url: doc.thumbnail_url as string | undefined,
  tags: doc.tags as string[] | undefined,
  maker_name: doc.maker_name as string | undefined,
});

export async function listGroupBuys(filters: {
  item_type?: string;
  status?: string;
  sort_by?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDbOrThrow();
  const collection = db.collection(COLLECTION);

  const query: Record<string, unknown> = {};
  if (filters.item_type) query.item_type = filters.item_type;
  if (filters.status) query.status = filters.status;
  else query.status = { $in: ['active', 'upcoming'] };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    popular: { supporter_count: -1 },
    deadline: { end_date: 1 },
    discount: { max_discount_rate: -1 },
    newest: { start_date: -1 },
  };

  const sort = sortMap[filters.sort_by ?? 'popular'] ?? { supporter_count: -1 };
  const limit = Math.min(filters.limit ?? 20, 50);
  const offset = filters.offset ?? 0;

  const docs = await collection
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .toArray();

  const total = await collection.countDocuments(query);

  return {
    group_buys: docs.map((doc) => mapDoc(doc as Record<string, unknown>)),
    total,
  };
}

export async function getGroupBuyById(id: string): Promise<GroupBuyDoc | null> {
  const db = await getDbOrThrow();
  const query = ObjectId.isValid(id)
    ? { $or: [{ _id: new ObjectId(id) }, { id }] }
    : { id };

  const doc = await db.collection(COLLECTION).findOne(query);
  if (!doc) return null;
  return mapDoc(doc as Record<string, unknown>);
}

export async function joinGroupBuy(groupBuyId: string, userId: string): Promise<GroupBuyDoc> {
  const db = await getDbOrThrow();
  const collection = db.collection(COLLECTION);

  const oid = ObjectId.isValid(groupBuyId) ? new ObjectId(groupBuyId) : null;
  const query = oid ? { _id: oid } : { id: groupBuyId };

  const doc = await collection.findOne(query);
  if (!doc) throw new AppError('Group buy not found', 404, 'not_found');

  const participants = (doc.participants as string[]) ?? [];
  if (participants.includes(userId)) {
    throw new AppError('Already joined', 409, 'already_joined');
  }

  const goalQty = (doc.goal_quantity as number) ?? 0;
  const nextQty = ((doc.current_quantity as number) ?? 0) + 1;
  const nextRate = goalQty > 0 ? Math.round((nextQty / goalQty) * 100) : 0;

  await collection.updateOne(query, {
    $inc: { supporter_count: 1, current_quantity: 1 },
    $set: { achievement_rate: nextRate },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $push: { participants: userId } as any,
  });

  const updated = await collection.findOne(query);
  return mapDoc(updated as Record<string, unknown>);
}

export async function leaveGroupBuy(groupBuyId: string, userId: string): Promise<void> {
  const db = await getDbOrThrow();
  const collection = db.collection(COLLECTION);

  const oid = ObjectId.isValid(groupBuyId) ? new ObjectId(groupBuyId) : null;
  const query = oid ? { _id: oid } : { id: groupBuyId };

  const doc = await collection.findOne(query);
  if (!doc) throw new AppError('Group buy not found', 404, 'not_found');

  const goalQty = (doc.goal_quantity as number) ?? 0;
  const nextQty = Math.max(0, ((doc.current_quantity as number) ?? 0) - 1);
  const nextRate = goalQty > 0 ? Math.round((nextQty / goalQty) * 100) : 0;

  await collection.updateOne(query, {
    $inc: { supporter_count: -1 },
    $set: { current_quantity: nextQty, achievement_rate: nextRate },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $pull: { participants: userId } as any,
  });
}

export async function getUserJoinedGroupBuys(userId: string) {
  const db = await getDbOrThrow();
  const docs = await db.collection(COLLECTION)
    .find({ participants: userId })
    .sort({ start_date: -1 })
    .toArray();

  return {
    group_buys: docs.map((doc) => mapDoc(doc as Record<string, unknown>)),
    total: docs.length,
  };
}
