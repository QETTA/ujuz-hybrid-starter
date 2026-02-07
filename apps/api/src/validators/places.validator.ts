import { z } from 'zod';

const parseNumber = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const parseStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const flattened = value.flatMap((item) =>
      String(item)
        .split(',')
        .map((entry) => entry.trim())
    );
    const filtered = flattened.filter(Boolean);
    return filtered.length ? filtered : undefined;
  }

  if (typeof value === 'string') {
    const items = value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }

  return undefined;
};

export const nearbyQuerySchema = z.object({
  lat: z.preprocess(parseNumber, z.coerce.number().min(-90).max(90)),
  lng: z.preprocess(parseNumber, z.coerce.number().min(-180).max(180)),
  radius: z
    .preprocess(parseNumber, z.coerce.number().int().min(100).max(50_000))
    .default(5_000),
  categories: z.preprocess(parseStringArray, z.array(z.string().min(1))).optional(),
  limit: z
    .preprocess(parseNumber, z.coerce.number().int().min(1).max(50))
    .default(20),
  offset: z
    .preprocess(parseNumber, z.coerce.number().int().min(0).max(10_000))
    .default(0)
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(50),
  limit: z
    .preprocess(parseNumber, z.coerce.number().int().min(1).max(50))
    .default(10)
});

export const placeIdParamSchema = z.object({
  id: z.string().min(1).max(128)
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type PlaceIdParam = z.infer<typeof placeIdParamSchema>;
