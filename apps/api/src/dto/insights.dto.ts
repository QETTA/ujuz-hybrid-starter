export type DataBlock = {
  value: string | number;
  source: string;
  updatedAt: string;
  confidence: number;
};

export type PlaceInsights = {
  placeId: string;
  waitTime?: DataBlock;
  crowdLevel?: DataBlock;
};

type InsightDoc = {
  placeId?: string;
  category?: string;
  refinedAt?: Date | string;
  confidence?: number;
  extractedInfo?: unknown;
  source?: string;
};

const normalizeConfidence = (value: unknown): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.5;
  }

  if (value > 1 && value <= 100) {
    return Math.max(0, Math.min(1, value / 100));
  }

  return Math.max(0, Math.min(1, value));
};

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const pickValue = (info: unknown, keys: string[]): string | number | undefined => {
  if (info && typeof info === 'object') {
    const record = info as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' || typeof value === 'string') {
        return value;
      }
    }
  }

  if (typeof info === 'string' || typeof info === 'number') {
    return info;
  }

  return undefined;
};

const buildDataBlock = (doc: InsightDoc, value: string | number): DataBlock => ({
  value,
  source: doc.source ?? 'unknown',
  updatedAt: toIsoString(doc.refinedAt),
  confidence: normalizeConfidence(doc.confidence)
});

export const mapInsightsForPlace = (
  placeId: string,
  docs: InsightDoc[]
): PlaceInsights => {
  const result: PlaceInsights = { placeId };

  for (const doc of docs) {
    const category = doc.category ?? '';
    const info = doc.extractedInfo;

    if (category === 'wait_time') {
      const minutes = pickValue(info, ['waitingMinutes', 'waitMinutes']);
      const raw = pickValue(info, ['waitTime', 'value', 'text']);
      const value =
        typeof minutes === 'number'
          ? `${minutes}\ubd84`
          : raw ?? (typeof minutes === 'string' ? minutes : undefined);

      if (value !== undefined) {
        result.waitTime = buildDataBlock(doc, value);
      }
    }

    if (category === 'crowd_level') {
      const value = pickValue(info, ['crowdLevel', 'level', 'value', 'text']);
      if (value !== undefined) {
        result.crowdLevel = buildDataBlock(doc, value);
      }
    }
  }

  return result;
};
