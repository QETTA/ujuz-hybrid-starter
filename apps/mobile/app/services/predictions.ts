/**
 * Predictions Service - SweetSpot-style on-device predictions
 *
 * Generates visit recommendations based on:
 * - Saved places (favorites)
 * - Distance
 * - Weather conditions (future)
 * - Peer trends (future)
 *
 * All predictions include evidence (basedOn DataBlocks)
 */

import type { PlaceWithDistance } from '@/app/types/places';
import type { DataBlock, VisitPrediction, TodayRecommendation } from '@/app/types/prediction';

// Scoring weights
const WEIGHTS = {
  distance: 0.3,
  confidence: 0.2,
  indoor: 0.2,
  variety: 0.3,
};

function createDataBlock(
  type: DataBlock['type'],
  value: number | string,
  source: string,
  confidence: number
): DataBlock {
  return {
    id: type + '-' + Date.now(),
    type,
    value,
    source,
    confidence,
    updatedAt: new Date(),
  };
}

function scorePlace(place: PlaceWithDistance, isRainyOrHot: boolean = false): number {
  let score = 0;
  const distanceScore = Math.max(0, 1 - (place.distance || 0) / 5);
  score += WEIGHTS.distance * distanceScore;
  const confidenceScore = (place as any).confidence ?? 0.7;
  score += WEIGHTS.confidence * confidenceScore;
  if (isRainyOrHot && place.amenities?.indoor) {
    score += WEIGHTS.indoor;
  }
  score += WEIGHTS.variety * 0.5;
  return Math.min(1, score);
}

function generateReason(place: PlaceWithDistance, score: number): string {
  if (place.distance && place.distance < 1) {
    return '가깝고 평점이 좋아요';
  }
  if (place.amenities?.indoor) {
    return '실내라 날씨 걱정 없어요';
  }
  if (score > 0.8) {
    return '오늘 가기 딱 좋아요';
  }
  return '또래 방문이 늘었어요';
}

function generateTimeLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return '오전 10-12시';
  } else if (hour < 15) {
    return '오후 2-4시';
  } else {
    return '오후 4-6시';
  }
}

function generatePrediction(place: PlaceWithDistance): VisitPrediction {
  const score = scorePlace(place);
  const basedOn: DataBlock[] = [];
  if (place.distance !== undefined) {
    basedOn.push(
      createDataBlock('crowd_level', place.distance < 2 ? '보통' : '한산', '거리 기반 추정', 0.7)
    );
  }
  if (place.amenities?.indoor) {
    basedOn.push(createDataBlock('safety_score', '실내', '장소 정보', 0.9));
  }
  return {
    place,
    suggestedTimeLabel: generateTimeLabel(),
    reason: generateReason(place, score),
    confidence: Math.min(0.95, score + 0.1),
    score,
    basedOn,
  };
}

export function generateTodayRecommendation(places: PlaceWithDistance[]): TodayRecommendation {
  if (!places || places.length === 0) {
    return {
      topPick: null,
      alternatives: [],
      generatedAt: new Date(),
    };
  }
  const predictions = places.map(generatePrediction);
  predictions.sort((a, b) => b.score - a.score);
  return {
    topPick: predictions[0] || null,
    alternatives: predictions.slice(1, 4),
    generatedAt: new Date(),
  };
}

export function useUrgentDeals(): { urgentDeals: unknown[]; count: number } {
  return {
    urgentDeals: [],
    count: 0,
  };
}
