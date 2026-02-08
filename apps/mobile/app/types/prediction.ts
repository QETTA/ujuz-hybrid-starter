/**
 * Prediction Types - SweetSpot-style predictions with DataBlock evidence
 */

import type { PlaceWithDistance } from './places';

/**
 * DataBlock represents a piece of evidence with provenance
 */
export interface DataBlock {
  id: string;
  type: 'wait_time' | 'crowd_level' | 'peer_visits' | 'safety_score' | 'deal_count';
  value: number | string;
  source: string;
  confidence: number; // 0-1
  updatedAt: Date;
  provenanceUrl?: string;
}

/**
 * Visit prediction for a single place
 */
export interface VisitPrediction {
  place: PlaceWithDistance;
  suggestedTimeLabel: string; // e.g., "오후 2-4시"
  reason: string; // Max 22-28 chars in Korean
  confidence: number; // 0-1
  score: number; // Internal scoring
  basedOn: DataBlock[]; // Evidence blocks
}

/**
 * Today's recommendation bundle
 */
export interface TodayRecommendation {
  topPick: VisitPrediction | null;
  alternatives: VisitPrediction[];
  generatedAt: Date;
}
