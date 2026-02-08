/**
 * UJUz - Admission Score Prediction Types
 * 입소 점수 예측 시스템
 */

import type { AgeClass, PriorityType } from './auth';

export interface AdmissionScoreInput {
  facility_id: string;
  child_id: string;
  target_class: AgeClass;
  priority_type: PriorityType;
  additional_priorities: PriorityType[];
  waiting_position?: number;
}

export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface AdmissionFactors {
  turnover_rate: { score: number; weight: number; description: string };
  regional_competition: { score: number; weight: number; description: string };
  priority_bonus: { score: number; weight: number; description: string };
  seasonal_factor: { score: number; weight: number; description: string };
  waitlist_factor: { score: number; weight: number; description: string };
}

export interface SimilarCase {
  priority_type: PriorityType;
  waiting_months: number;
  result: 'admitted' | 'waiting' | 'withdrawn';
  year: number;
}

export interface AdmissionScoreResult {
  id: string;
  facility_id: string;
  facility_name: string;
  child_id: string;
  overall_score: number;
  grade: ScoreGrade;
  probability: number;
  estimated_months: number;
  confidence: number;
  factors: AdmissionFactors;
  similar_cases: SimilarCase[];
  recommendations: string[];
  calculated_at: string;
}

export interface AdmissionHistory {
  results: AdmissionScoreResult[];
  total: number;
}

export interface FacilityAdmissionStats {
  facility_id: string;
  avg_wait_months: Record<AgeClass, number>;
  turnover_rate: Record<AgeClass, number>;
  total_capacity: number;
  current_enrolled: number;
  waitlist_count: number;
  last_updated: string;
}
