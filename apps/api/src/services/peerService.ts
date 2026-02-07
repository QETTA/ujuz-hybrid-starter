/**
 * UJUz - Peer Service
 */

import { getMongoDb, connectMongo } from '@ujuz/db';
import { env } from '@ujuz/config';
import { AppError } from '@ujuz/shared';

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }
  const existing = getMongoDb();
  if (existing) return existing;
  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

export async function getLiveStatus() {
  const db = await getDbOrThrow();
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const pipeline = [
    { $match: { createdAt: { $gte: fifteenMinutesAgo } } },
    {
      $group: {
        _id: '$ageGroup',
        count: { $sum: 1 },
        latestActivity: { $max: '$createdAt' },
      },
    },
  ];

  const results = await db.collection('peerActivities').aggregate(pipeline).toArray();

  const totalActive = results.reduce((sum, r) => sum + (r.count as number), 0);

  return {
    total_active: totalActive,
    by_age_group: results.map((r) => ({
      age_group: r._id as string,
      count: r.count as number,
      latest_activity: (r.latestActivity as Date).toISOString(),
    })),
    snapshot_at: new Date().toISOString(),
  };
}

export async function getActivities(limit = 20, offset = 0) {
  const db = await getDbOrThrow();

  const collection = db.collection('peerActivities');

  const [docs, total] = await Promise.all([
    collection
      .find(
        {},
        {
          projection: {
            userId: 1, activityType: 1, placeId: 1,
            placeName: 1, ageGroup: 1, description: 1, createdAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    collection.estimatedDocumentCount(),
  ]);

  return {
    activities: docs.map((doc) => ({
      id: doc._id.toString(),
      user_id: doc.userId as string,
      activity_type: doc.activityType as string,
      place_id: doc.placeId as string | undefined,
      place_name: doc.placeName as string | undefined,
      age_group: doc.ageGroup as string | undefined,
      description: doc.description as string | undefined,
      created_at: (doc.createdAt as Date).toISOString(),
    })),
    total,
  };
}

export async function getTrendingPlaces(limit = 10) {
  const db = await getDbOrThrow();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { createdAt: { $gte: oneWeekAgo }, placeId: { $exists: true } } },
    {
      $group: {
        _id: { placeId: '$placeId', userId: '$userId' },
        placeName: { $first: '$placeName' },
        activities: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.placeId',
        placeName: { $first: '$placeName' },
        activityCount: { $sum: '$activities' },
        uniqueUsers: { $sum: 1 },
      },
    },
    {
      $project: {
        place_id: '$_id',
        place_name: '$placeName',
        activity_count: '$activityCount',
        unique_visitors: '$uniqueUsers',
      },
    },
    { $sort: { activity_count: -1 } },
    { $limit: limit },
  ];

  const results = await db.collection('peerActivities').aggregate(pipeline).toArray();

  return {
    places: results.map((r) => ({
      place_id: r.place_id as string,
      place_name: r.place_name as string,
      activity_count: r.activity_count as number,
      unique_visitors: r.unique_visitors as number,
    })),
  };
}

export async function recordActivity(data: {
  user_id: string;
  activity_type: string;
  place_id?: string;
  place_name?: string;
  age_group?: string;
  description?: string;
}) {
  const db = await getDbOrThrow();

  const doc = {
    userId: data.user_id,
    activityType: data.activity_type,
    placeId: data.place_id,
    placeName: data.place_name,
    ageGroup: data.age_group,
    description: data.description,
    createdAt: new Date(),
  };

  const result = await db.collection('peerActivities').insertOne(doc);

  return { id: result.insertedId.toString(), created_at: doc.createdAt.toISOString() };
}
