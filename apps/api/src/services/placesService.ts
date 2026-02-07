import { ObjectId } from 'mongodb';
import { env } from '@ujuz/config';
import { connectMongo, getMongoDb } from '@ujuz/db';
import { AppError, distanceMeters } from '@ujuz/shared';
import {
  extractPlaceLocation,
  mapPlaceDocToSummary,
  mapPlaceDocToWithDistance,
  PlaceSummary,
  PlaceWithDistance
} from '../dto/places.dto.js';
import { NearbyQuery, SearchQuery } from '../validators/places.validator.js';

const EARTH_RADIUS_METERS = 6371_000;

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

const buildCategoriesFilter = (categories?: string[]) => {
  if (!categories || categories.length === 0) {
    return {};
  }

  return { categories: { $in: categories } };
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const detectLocationMode = async (
  collectionName: string
): Promise<'geojson' | 'latlng' | 'unknown'> => {
  const db = await getDbOrThrow();
  const collection = db.collection(collectionName);

  const geoJsonSample = await collection.findOne({
    'location.type': 'Point',
    'location.coordinates.0': { $type: 'number' },
    'location.coordinates.1': { $type: 'number' }
  });

  if (geoJsonSample) {
    return 'geojson';
  }

  const latLngSample = await collection.findOne({
    'location.lat': { $type: 'number' },
    'location.lng': { $type: 'number' }
  });

  if (latLngSample) {
    return 'latlng';
  }

  return 'unknown';
};

const getBoundingBox = (lat: number, lng: number, radius: number) => {
  const latRadius = (radius / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngRadius =
    (radius / EARTH_RADIUS_METERS) * (180 / Math.PI) /
    Math.max(Math.cos((lat * Math.PI) / 180), 0.0001);

  return {
    minLat: lat - latRadius,
    maxLat: lat + latRadius,
    minLng: lng - lngRadius,
    maxLng: lng + lngRadius
  };
};

export const fetchNearbyPlaces = async (
  query: NearbyQuery
): Promise<PlaceWithDistance[]> => {
  const db = await getDbOrThrow();
  const collectionName = env.MONGODB_PLACES_COLLECTION;
  const collection = db.collection(collectionName);
  const categoriesFilter = buildCategoriesFilter(query.categories);

  try {
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [query.lng, query.lat] },
          key: 'location',
          distanceField: 'distanceMeters',
          maxDistance: query.radius,
          spherical: true,
          query: categoriesFilter
        }
      },
      { $skip: query.offset },
      { $limit: query.limit }
    ];

    const docs = await collection.aggregate(pipeline).toArray();

    return docs
      .map((doc) =>
        mapPlaceDocToWithDistance(
          doc as Record<string, unknown>,
          typeof doc.distanceMeters === 'number' ? doc.distanceMeters : 0
        )
      )
      .filter((item): item is PlaceWithDistance => Boolean(item));
  } catch {
    // fallthrough to manual distance computation
  }

  const mode = await detectLocationMode(collectionName);
  if (mode === 'unknown') {
    return [];
  }

  const { minLat, maxLat, minLng, maxLng } = getBoundingBox(
    query.lat,
    query.lng,
    query.radius
  );

  const locationFilter =
    mode === 'geojson'
      ? {
          'location.coordinates.1': { $gte: minLat, $lte: maxLat },
          'location.coordinates.0': { $gte: minLng, $lte: maxLng }
        }
      : {
          'location.lat': { $gte: minLat, $lte: maxLat },
          'location.lng': { $gte: minLng, $lte: maxLng }
        };

  const queryFilter = {
    ...categoriesFilter,
    ...locationFilter
  };

  const batchSize = Math.min(1000, query.limit + query.offset + 200);
  const docs = await collection
    .find(queryFilter)
    .limit(batchSize)
    .toArray();

  const withDistance = docs
    .map((doc) => {
      const location = extractPlaceLocation(doc as Record<string, unknown>);
      if (!location) {
        return null;
      }

      const distance = distanceMeters(
        query.lat,
        query.lng,
        location.lat,
        location.lng
      );

      if (distance > query.radius) {
        return null;
      }

      return mapPlaceDocToWithDistance(
        doc as Record<string, unknown>,
        distance
      );
    })
    .filter((item): item is PlaceWithDistance => Boolean(item));

  return withDistance
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(query.offset, query.offset + query.limit);
};

export const searchPlaces = async (
  query: SearchQuery
): Promise<PlaceSummary[]> => {
  const db = await getDbOrThrow();
  const collection = db.collection(env.MONGODB_PLACES_COLLECTION);

  try {
    const docs = await collection
      .find(
        { $text: { $search: query.q } },
        {
          projection: {
            score: { $meta: 'textScore' },
            name: 1,
            placeId: 1,
            categories: 1,
            location: 1
          }
        }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(query.limit)
      .toArray();

    return docs
      .map((doc) => mapPlaceDocToSummary(doc as Record<string, unknown>))
      .filter((item): item is PlaceSummary => Boolean(item));
  } catch {
    const regex = new RegExp(escapeRegex(query.q), 'i');
    const docs = await collection
      .find({ name: regex })
      .limit(query.limit)
      .toArray();

    return docs
      .map((doc) => mapPlaceDocToSummary(doc as Record<string, unknown>))
      .filter((item): item is PlaceSummary => Boolean(item));
  }
};

export const fetchPlaceById = async (
  id: string
): Promise<PlaceSummary | null> => {
  const db = await getDbOrThrow();
  const collection = db.collection(env.MONGODB_PLACES_COLLECTION);

  const query = ObjectId.isValid(id)
    ? { $or: [{ placeId: id }, { _id: new ObjectId(id) }] }
    : { placeId: id };

  const doc = await collection.findOne(query);
  if (!doc) {
    return null;
  }

  return mapPlaceDocToSummary(doc as Record<string, unknown>);
};
