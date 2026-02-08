/**
 * UJUz 데이터 소스 타입 정의
 *
 * 어린이집 입소 및 놀이 공간 정보를 위한 공공 데이터 API 타입
 * - 한국관광공사 TourAPI
 * - 행정안전부 전국어린이놀이시설정보서비스
 *
 * @see https://api.visitkorea.or.kr/
 * @see https://www.data.go.kr/data/15124519/openapi.do
 */

// ============================================
// 공통 타입
// ============================================

/** 데이터 소스 구분 */
export type UJUzDataSource = 'TOUR_API' | 'PLAYGROUND_API' | 'CHILDCARE_API';

/** 장소 카테고리 */
export const PLACE_CATEGORIES = {
  /** 놀이공원/테마파크 (야외) */
  AMUSEMENT_PARK: 'amusement_park',
  /** 동물원/수족관 (야외) */
  ZOO_AQUARIUM: 'zoo_aquarium',
  /** 키즈카페/실내놀이터 (실내) */
  KIDS_CAFE: 'kids_cafe',
  /** 박물관/체험관 (실내) */
  MUSEUM: 'museum',
  /** 자연/공원 (야외) */
  NATURE_PARK: 'nature_park',
  /** 놀이방 있는 식당 (실내) */
  RESTAURANT: 'restaurant',
  /** 공공시설 (육아나눔터, 장난감도서관 등) */
  PUBLIC_FACILITY: 'public_facility',
  /** 기타 */
  OTHER: 'other',
} as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[keyof typeof PLACE_CATEGORIES];

/** Quick Filter 카테고리 (야외/실내/공공/식당) */
export const FILTER_CATEGORIES = {
  /** 야외 (공원, 놀이터, 자연체험, 물놀이장, 농장) */
  OUTDOOR: 'outdoor',
  /** 실내 (키즈카페, 실내놀이터, 박물관, 도서관) */
  INDOOR: 'indoor',
  /** 공공시설 (육아나눔터, 장난감도서관, 공공수영장, 체육관) */
  PUBLIC: 'public',
  /** 식당 (놀이방 있는 식당, 키즈카페 식당, 패밀리 레스토랑) */
  RESTAURANT: 'restaurant',
} as const;

export type FilterCategory = (typeof FILTER_CATEGORIES)[keyof typeof FILTER_CATEGORIES];

/** PlaceCategory → FilterCategory 매핑 */
export const PLACE_TO_FILTER_CATEGORY: Record<PlaceCategory, FilterCategory> = {
  amusement_park: 'outdoor',
  zoo_aquarium: 'outdoor',
  nature_park: 'outdoor',
  kids_cafe: 'indoor',
  museum: 'indoor',
  restaurant: 'restaurant',
  public_facility: 'public',
  other: 'indoor', // 기본값
};

/** 연령대 적합성 */
export const AGE_GROUPS = {
  /** 영아 (0-2세) */
  INFANT: 'infant',
  /** 유아 (3-5세) */
  TODDLER: 'toddler',
  /** 아동 (6-9세) */
  CHILD: 'child',
  /** 초등 (10-12세) */
  ELEMENTARY: 'elementary',
} as const;

export type AgeGroup = (typeof AGE_GROUPS)[keyof typeof AGE_GROUPS];

/** 편의시설 */
export interface Amenities {
  /** 유모차 접근 가능 */
  strollerAccess?: boolean;
  /** 수유실 */
  nursingRoom?: boolean;
  /** 기저귀 교환대 */
  diaperChangingStation?: boolean;
  /** 주차장 */
  parking?: boolean;
  /** 식당/카페 (boolean - 편의시설로서의 식당 유무) */
  restaurant?: boolean;
  /** 화장실 */
  restroom?: boolean;
  /** 휠체어 접근 가능 */
  wheelchairAccess?: boolean;
  /** 아기 의자 */
  babyChair?: boolean;
  /** 수유 쿠션 */
  nursingCushion?: boolean;
  /** 실내 시설 */
  indoor?: boolean;
  /** 야외 시설 */
  outdoor?: boolean;
}

/** 혼잡도 정보 (실시간 및 예측) */
export interface CrowdLevel {
  /** 현재 혼잡도 (1-5) */
  current?: number;
  /** 시간대별 혼잡도 예측 */
  hourly?: {
    hour: number; // 0-23
    level: number; // 1-5 (1=한산, 5=매우혼잡)
  }[];
  /** 주말 혼잡도 */
  weekend?: number;
  /** 공휴일 혼잡도 */
  holiday?: number;
  /** 마지막 업데이트 */
  lastUpdated?: string;
}

/** 예약 정보 */
export interface ReservationInfo {
  /** 예약 가능 여부 */
  available: boolean;
  /** 예약 필수 여부 */
  required?: boolean;
  /** 예약 URL */
  url?: string;
  /** 전화 예약 */
  phoneOnly?: boolean;
  /** 예약 가능 시간대 */
  availableHours?: string;
  /** 취소 정책 */
  cancellationPolicy?: string;
}

/** 식당 전용 메타데이터 (놀이방 있는 식당) */
export interface RestaurantMetadata {
  /** 놀이방 유무 */
  hasPlayroom: boolean;

  /** 놀이방 크기 (평수) */
  playroomSize?: number;

  /** 놀이방 연령대 */
  playroomAges?: AgeGroup[];

  /** 보호자 동반 필수 여부 */
  guardianRequired?: boolean;

  /** 식사 중 돌봄 가능 여부 */
  attendantAvailable?: boolean;

  /** 키즈 메뉴 제공 */
  kidsMenuAvailable?: boolean;

  /** 키즈 메뉴 가격대 */
  kidsMenuPriceRange?: {
    min: number;
    max: number;
  };

  /** 아기 의자 개수 */
  babyChairCount?: number;

  /** 수유실 유무 */
  nursingRoomAvailable?: boolean;

  /** 기저귀 교환대 유무 */
  changingStationAvailable?: boolean;

  /** 주차 정보 */
  parkingInfo?: {
    available: boolean;
    free?: boolean;
    capacity?: number;
  };

  /** 예약 정보 */
  reservation?: ReservationInfo;

  /** 대기 시간 (분, 실시간) */
  waitingTime?: number;

  /** 음식 종류 */
  cuisineType?: string[];

  /** 가격대 (1-5) */
  priceLevel?: number;
}

/** 운영 시간 */
export interface OperatingHours {
  /** 월-금 */
  weekday?: string;
  /** 토요일 */
  saturday?: string;
  /** 일요일/공휴일 */
  sunday?: string;
  /** 휴무일 */
  closedDays?: string;
}

/** 입장료 정보 */
export interface AdmissionFee {
  /** 무료 여부 */
  isFree: boolean;
  /** 성인 요금 */
  adult?: number;
  /** 아동 요금 */
  child?: number;
  /** 유아 요금 */
  infant?: number;
  /** 요금 설명 */
  description?: string;
}

// ============================================
// 정규화된 장소 데이터
// ============================================

export interface NormalizedPlace {
  /** 고유 ID */
  id: string;

  /** 출처 */
  source: UJUzDataSource;

  /** 원본 URL */
  sourceUrl: string;

  /** 수집 시점 */
  fetchedAt: string;

  /** 장소명 */
  name: string;

  /** 카테고리 */
  category: PlaceCategory;

  /** 주소 */
  address: string;

  /** 상세 주소 */
  addressDetail?: string;

  /** 위도 */
  latitude?: number;

  /** 경도 */
  longitude?: number;

  /** 지역 코드 */
  areaCode?: string;

  /** 시군구 코드 */
  sigunguCode?: string;

  /** 전화번호 */
  tel?: string;

  /** 홈페이지 URL */
  homepage?: string;

  /** 설명 */
  description?: string;

  /** 대표 이미지 URL */
  imageUrl?: string;

  /** 썸네일 이미지 URL */
  thumbnailUrl?: string;

  /** 추천 연령대 */
  recommendedAges?: AgeGroup[];

  /** 편의시설 */
  amenities?: Amenities;

  /** 평점 */
  rating?: number;

  /** 리뷰 수 */
  reviewCount?: number;

  /** 운영 시간 */
  operatingHours?: OperatingHours;

  /** 입장료 */
  admissionFee?: AdmissionFee;

  /** 식당 전용 메타데이터 (놀이방 있는 식당인 경우) */
  restaurantMetadata?: RestaurantMetadata;

  /** 혼잡도 정보 */
  crowdLevel?: CrowdLevel;

  /** 예약 정보 */
  reservationInfo?: ReservationInfo;

  /** 원본 데이터 */
  rawData: unknown;
}

// ============================================
// 검색 필터
// ============================================

export interface UJUzSearchFilters {
  /** 카테고리 필터 */
  categories?: PlaceCategory[];
  /** 지역 코드 */
  areaCode?: string;
  /** 시군구 코드 */
  sigunguCode?: string;
  /** 키워드 검색 */
  keyword?: string;
  /** 위치 기반 검색 */
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  /** 추천 연령대 */
  ageGroups?: AgeGroup[];
  /** 페이지 번호 */
  page?: number;
  /** 페이지 크기 */
  pageSize?: number;
}

// ============================================
// 검색 결과
// ============================================

export interface UJUzSearchResult {
  /** 장소 목록 */
  places: NormalizedPlace[];
  /** 총 건수 */
  totalCount: number;
  /** 현재 페이지 */
  currentPage: number;
  /** 총 페이지 수 */
  totalPages: number;
  /** 검색 시점 */
  searchedAt: string;
  /** 캐시 여부 */
  fromCache: boolean;
}

// ============================================
// 콘텐츠 소스 타입 (YouTube, 네이버 블로그, 클립)
// ============================================

/** 콘텐츠 소스 구분 */
export type ContentSource = 'YOUTUBE' | 'NAVER_BLOG' | 'NAVER_CLIP';

/** 콘텐츠 타입 */
export const CONTENT_TYPES = {
  /** 유튜브 영상 */
  VIDEO: 'video',
  /** 블로그 포스트 */
  BLOG_POST: 'blog_post',
  /** 짧은 영상 (클립/쇼츠) */
  SHORT_VIDEO: 'short_video',
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

// ============================================
// 정규화된 콘텐츠 데이터
// ============================================

export interface NormalizedContent {
  /** 고유 ID */
  id: string;

  /** 출처 */
  source: ContentSource;

  /** 콘텐츠 타입 */
  type: ContentType;

  /** 원본 URL */
  sourceUrl: string;

  /** 수집 시점 */
  fetchedAt: string;

  /** 제목 */
  title: string;

  /** 설명/내용 요약 */
  description?: string;

  /** 썸네일 URL */
  thumbnailUrl?: string;

  /** 작성자/채널명 */
  author: string;

  /** 작성자 프로필 URL */
  authorUrl?: string;

  /** 작성자 프로필 이미지 */
  authorThumbnail?: string;

  /** 게시일 */
  publishedAt: string;

  /** 조회수 */
  viewCount?: number;

  /** 좋아요 수 */
  likeCount?: number;

  /** 댓글 수 */
  commentCount?: number;

  /** 영상 길이 (초) - 영상 콘텐츠용 */
  duration?: number;

  /** 관련 장소 ID */
  relatedPlaceId?: string;

  /** 관련 장소명 */
  relatedPlaceName?: string;

  /** 태그/키워드 */
  tags?: string[];

  /** 원본 데이터 */
  rawData: unknown;
}

// ============================================
// 콘텐츠 검색 필터
// ============================================

export interface ContentSearchFilters {
  /** 검색 키워드 */
  keyword: string;
  /** 콘텐츠 소스 */
  sources?: ContentSource[];
  /** 정렬 기준 */
  sortBy?: 'date' | 'relevance' | 'viewCount';
  /** 게시일 이후 (ISO 날짜) */
  publishedAfter?: string;
  /** 페이지 번호 */
  page?: number;
  /** 페이지 크기 */
  pageSize?: number;
  /** 안전 검색 (어린이용) */
  safeSearch?: boolean;
}

// ============================================
// 콘텐츠 검색 결과
// ============================================

export interface ContentSearchResult {
  /** 콘텐츠 목록 */
  contents: NormalizedContent[];
  /** 총 건수 */
  totalCount: number;
  /** 현재 페이지 */
  currentPage: number;
  /** 다음 페이지 토큰 (YouTube용) */
  nextPageToken?: string;
  /** 검색 시점 */
  searchedAt: string;
  /** 캐시 여부 */
  fromCache: boolean;
}

// ============================================
// API Response Types (for React Native)
// ============================================

export interface PlaceWithDistance extends NormalizedPlace {
  /** Distance from user in meters */
  distance?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
