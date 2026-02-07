import { z } from 'zod';

const parsePlaceIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

export const insightsQuerySchema = z.object({
  placeIds: z
    .preprocess(parsePlaceIds, z.array(z.string().min(1)).min(1).max(100))
});

export type InsightsQuery = z.infer<typeof insightsQuerySchema>;
