/**
 * DataBlock Types
 *
 * DataBlock is the atomic unit of intelligence with provenance + confidence.
 */

export type DataBlockSource = 'public_api' | 'user_report' | 'crawler' | 'inference';
export type DataBlockVerifier = 'manual' | 'automated';

export interface DataBlock {
  value: string | number;
  source: DataBlockSource;
  updatedAt: Date;
  confidence: number; // 0..1
  provenanceUrl?: string;
  verifiedBy?: DataBlockVerifier;
}

export interface PlaceInsights {
  waitTime?: DataBlock; // "23분 대기"
  crowdLevel?: DataBlock; // "혼잡"
  safetyScore?: DataBlock; // "0.89"
  dealCount?: DataBlock; // "3개 활성 딜"
  peerVisits?: DataBlock; // "이번 주 12명 방문"
}

export interface PlaceFeatureProperties {
  id: string;
  name: string;
  insights: PlaceInsights;
  overallConfidence: number;
}
