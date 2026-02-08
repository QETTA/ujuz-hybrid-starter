/**
 * Peer Sync Data Types
 *
 * 2026 KidsMap 킬러 기능: 또래 동기화 데이터 블록
 *
 * "내 아이 또래가 지금 어디 가고, 뭘 먹고, 뭘 사는지 실시간으로 보여주는 앱"
 */

import type { PlaceWithDistance } from './places';

// ============================================
// Child Profile Types
// ============================================

/** 아이 발달 단계 */
export type ChildStage =
  | 'pregnancy' // 임신 중
  | 'newborn' // 신생아 (0-3개월)
  | 'infant' // 영아 (4-12개월)
  | 'toddler' // 유아 (13-24개월)
  | 'preschool' // 미취학 (25-60개월)
  | 'elementary'; // 초등 (61개월+)

/** 아이 프로필 */
export interface ChildProfile {
  id: string;
  nickname: string;
  birthDate: string; // ISO date
  ageInMonths: number;
  stage: ChildStage;
  gender?: 'male' | 'female' | 'unknown';
  interests?: string[];
  allergies?: string[];
}

/** 또래 범위 설정 */
export interface PeerRange {
  /** 최소 나이 (개월) */
  minAgeMonths: number;
  /** 최대 나이 (개월) */
  maxAgeMonths: number;
  /** 검색 반경 (km) */
  radiusKm: number;
  /** 포함할 발달 단계 */
  stages: ChildStage[];
}

// ============================================
// Peer Activity Types
// ============================================

/** 또래 부모 활동 타입 */
export type PeerActivityType =
  | 'place_visit' // 장소 방문
  | 'place_save' // 장소 저장
  | 'group_buy' // 공구 참여
  | 'shorts_watch' // Shorts 시청
  | 'review_write'; // 리뷰 작성

/** 또래 활동 아이템 */
export interface PeerActivity {
  id: string;
  type: PeerActivityType;
  /** 활동한 또래 수 */
  peerCount: number;
  /** 관련 장소 */
  place?: {
    id: string;
    name: string;
    category: string;
    thumbnailUrl?: string;
  };
  /** 관련 공구 */
  groupBuy?: {
    id: string;
    title: string;
    discountPercent: number;
    participantCount: number;
  };
  /** 관련 Shorts */
  shorts?: {
    id: string;
    title: string;
    thumbnailUrl: string;
    viewCount: number;
  };
  /** 활동 시간 */
  timestamp: string;
  /** 표시 메시지 */
  message: string;
}

/** 또래 실시간 현황 */
export interface PeerLiveStatus {
  /** 현재 활동 중인 또래 부모 수 */
  activeNow: number;
  /** 오늘 활동한 또래 부모 수 */
  activeToday: number;
  /** 내 주변(반경 내) 활동 또래 수 */
  nearbyActive: number;
  /** 마지막 업데이트 시간 */
  lastUpdated: string;
}

// ============================================
// Peer Trends Types
// ============================================

/** 트렌드 기간 */
export type TrendPeriod = 'today' | 'week' | 'month';

/** 또래 인기 장소 */
export interface PeerTrendingPlace {
  place: PlaceWithDistance;
  /** 방문한 또래 수 */
  peerVisitCount: number;
  /** 순위 변동 (이전 기간 대비) */
  rankChange: number;
  /** 인기 상승 중 여부 */
  isTrending: boolean;
}

/** 또래 인기 공구 */
export interface PeerTrendingGroupBuy {
  id: string;
  title: string;
  category: 'ticket' | 'food' | 'fashion' | 'toy' | 'etc';
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  /** 참여한 또래 수 */
  peerParticipantCount: number;
  /** 총 참여자 수 */
  totalParticipantCount: number;
  /** 마감까지 남은 시간 (hours) */
  hoursRemaining: number;
  thumbnailUrl?: string;
}

/** 또래 인기 Shorts */
export interface PeerTrendingShorts {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  /** 시청한 또래 수 */
  peerWatchCount: number;
  /** 관련 장소 */
  relatedPlace?: {
    id: string;
    name: string;
  };
}

/** 또래 트렌드 데이터 */
export interface PeerTrends {
  period: TrendPeriod;
  /** 인기 장소 TOP 10 */
  topPlaces: PeerTrendingPlace[];
  /** 인기 공구 TOP 5 */
  topGroupBuys: PeerTrendingGroupBuy[];
  /** 인기 Shorts TOP 10 */
  topShorts: PeerTrendingShorts[];
  /** 트렌드 업데이트 시간 */
  updatedAt: string;
}

// ============================================
// Peer Sync Data Block (Main Type)
// ============================================

/** 또래 동기화 데이터 블록 - 핵심 킬러 기능 */
export interface PeerSyncDataBlock {
  /** 내 아이 프로필 */
  myChild: ChildProfile;

  /** 또래 범위 설정 */
  peerRange: PeerRange;

  /** 실시간 또래 현황 */
  liveStatus: PeerLiveStatus;

  /** 최근 또래 활동 피드 */
  recentActivities: PeerActivity[];

  /** 또래 트렌드 */
  trends: {
    daily: PeerTrends;
    weekly: PeerTrends;
    monthly: PeerTrends;
  };

  /** 또래 알림 설정 */
  notificationSettings: {
    /** 인기 장소 알림 */
    trendingPlaces: boolean;
    /** 공구 알림 */
    groupBuys: boolean;
    /** 근처 또래 활동 알림 */
    nearbyActivity: boolean;
    /** 알림 빈도 */
    frequency: 'realtime' | 'hourly' | 'daily';
  };
}

// ============================================
// Peer Sync API Types
// ============================================

/** 또래 활동 피드 요청 */
export interface PeerFeedRequest {
  childAgeMonths: number;
  ageRangeMonths?: number; // default ±3
  lat: number;
  lng: number;
  radiusKm?: number; // default 10
  limit?: number;
  offset?: number;
}

/** 또래 활동 피드 응답 */
export interface PeerFeedResponse {
  activities: PeerActivity[];
  liveStatus: PeerLiveStatus;
  hasMore: boolean;
  nextOffset: number;
}

/** 또래 트렌드 요청 */
export interface PeerTrendsRequest {
  childAgeMonths: number;
  ageRangeMonths?: number;
  period: TrendPeriod;
  lat?: number;
  lng?: number;
}

/** 또래 트렌드 응답 */
export interface PeerTrendsResponse {
  trends: PeerTrends;
  peerCount: number; // 분석된 또래 수
}

// ============================================
// UI Helper Types
// ============================================

/** 또래 활동 카드 표시 데이터 */
export interface PeerActivityCardData {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  peerCountText: string;
  timeAgo: string;
  actionType: 'navigate' | 'groupbuy' | 'watch';
  actionData: unknown;
  isUrgent?: boolean; // 공구 마감 임박 등
}

/** 또래 상태 뱃지 데이터 */
export interface PeerStatusBadgeData {
  count: number;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'error';
  pulse?: boolean; // 실시간 업데이트 애니메이션
}

// ============================================
// Utility Functions Types
// ============================================

/** 개월 수로 발달 단계 계산 */
export function getChildStage(ageInMonths: number): ChildStage {
  if (ageInMonths < 0) return 'pregnancy';
  if (ageInMonths <= 3) return 'newborn';
  if (ageInMonths <= 12) return 'infant';
  if (ageInMonths <= 24) return 'toddler';
  if (ageInMonths <= 60) return 'preschool';
  return 'elementary';
}

/** 발달 단계 한글 라벨 */
export function getStageLabel(stage: ChildStage): string {
  const labels: Record<ChildStage, string> = {
    pregnancy: '임신 중',
    newborn: '신생아',
    infant: '영아',
    toddler: '유아',
    preschool: '미취학',
    elementary: '초등',
  };
  return labels[stage];
}

/** 또래 범위 기본값 생성 */
export function getDefaultPeerRange(ageInMonths: number): PeerRange {
  const stage = getChildStage(ageInMonths);
  return {
    minAgeMonths: Math.max(0, ageInMonths - 3),
    maxAgeMonths: ageInMonths + 3,
    radiusKm: 10,
    stages: [stage],
  };
}
