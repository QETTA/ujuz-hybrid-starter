export type PlaceLocation = {
  lat: number;
  lng: number;
};

export type PlaceSummary = {
  placeId: string;
  id: string;
  name: string;
  categories?: string[];
  location?: PlaceLocation;
};

export type PlaceWithDistance = {
  placeId: string;
  id: string;
  name: string;
  categories?: string[];
  distanceMeters: number;
  location: PlaceLocation;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const extractLocation = (doc: Record<string, unknown>): PlaceLocation | null => {
  const location = doc.location as Record<string, unknown> | undefined;

  if (location) {
    if (
      location.type === 'Point' &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length >= 2
    ) {
      const [lng, lat] = location.coordinates as unknown[];
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }
    }

    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      return { lat: location.lat, lng: location.lng };
    }
  }

  return null;
};

const getPlaceId = (doc: Record<string, unknown>): string => {
  if (doc.placeId) {
    return String(doc.placeId);
  }

  if (doc._id) {
    return String(doc._id);
  }

  return '';
};

export const mapPlaceDocToSummary = (
  doc: Record<string, unknown>
): PlaceSummary | null => {
  if (typeof doc.name !== 'string') {
    return null;
  }

  const placeId = getPlaceId(doc);
  if (!placeId) {
    return null;
  }

  const summary: PlaceSummary = {
    placeId,
    id: placeId,
    name: doc.name
  };

  if (isStringArray(doc.categories)) {
    summary.categories = doc.categories;
  }

  const location = extractLocation(doc);
  if (location) {
    summary.location = location;
  }

  return summary;
};

export const mapPlaceDocToWithDistance = (
  doc: Record<string, unknown>,
  distanceMeters: number
): PlaceWithDistance | null => {
  const summary = mapPlaceDocToSummary(doc);
  if (!summary || !summary.location) {
    return null;
  }

  const { location } = summary;

  return {
    ...summary,
    location,
    distanceMeters
  };
};

export const extractPlaceLocation = extractLocation;
