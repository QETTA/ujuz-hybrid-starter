import { env } from '@ujuz/config';
import { connectMongo, getMongoDb } from '@ujuz/db';
import { AppError } from '@ujuz/shared';
import { mapInsightsForPlace, PlaceInsights } from '../dto/insights.dto.js';

const getDbOrThrow = async () => {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new AppError('MongoDB not configured', 503, 'mongo_not_configured');
  }

  const existing = getMongoDb();
  if (existing) {
    return existing;
  }

  return connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME);
};

export const fetchInsights = async (
  placeIds: string[]
): Promise<PlaceInsights[]> => {
  const db = await getDbOrThrow();
  const collection = db.collection(env.MONGODB_INSIGHTS_COLLECTION);

  const pipeline = [
    { $match: { placeId: { $in: placeIds } } },
    { $sort: { placeId: 1, category: 1, refinedAt: -1 as const } },
    {
      $group: {
        _id: { placeId: '$placeId', category: '$category' },
        doc: { $first: '$$ROOT' }
      }
    },
    { $group: { _id: '$_id.placeId', docs: { $push: '$doc' } } }
  ];

  const rows = await collection.aggregate(pipeline).toArray();
  const byPlace = new Map<string, PlaceInsights>();

  for (const row of rows) {
    const placeId = row._id as string;
    const docs = (row.docs ?? []) as unknown[];
    byPlace.set(
      placeId,
      mapInsightsForPlace(
        placeId,
        docs as {
          placeId?: string;
          category?: string;
          refinedAt?: Date | string;
          confidence?: number;
          extractedInfo?: unknown;
          source?: string;
        }[]
      )
    );
  }

  return placeIds.map((placeId) => byPlace.get(placeId) ?? { placeId });
};
