/**
 * YouTube Data API v3 Types
 *
 * Type definitions for YouTube API responses and KidsMap integration
 */

// ============================================
// YouTube Data API Response Types
// ============================================

/** YouTube API Thumbnail */
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

/** YouTube API Thumbnails collection */
export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

/** YouTube Search Result Snippet */
export interface YouTubeSearchSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  liveBroadcastContent: 'none' | 'live' | 'upcoming';
  publishTime: string;
}

/** YouTube Search Result ID */
export interface YouTubeSearchId {
  kind: string;
  videoId?: string;
  channelId?: string;
  playlistId?: string;
}

/** YouTube Search Result Item */
export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: YouTubeSearchId;
  snippet: YouTubeSearchSnippet;
}

/** YouTube Search Response */
export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

/** YouTube Video Statistics */
export interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount?: string;
  dislikeCount?: string;
  favoriteCount: string;
  commentCount?: string;
}

/** YouTube Video Content Details */
export interface YouTubeVideoContentDetails {
  duration: string; // ISO 8601 format (PT1M30S)
  dimension: '2d' | '3d';
  definition: 'hd' | 'sd';
  caption: 'true' | 'false';
  licensedContent: boolean;
  projection: 'rectangular' | '360';
}

/** YouTube Video Snippet */
export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId: string;
  liveBroadcastContent: 'none' | 'live' | 'upcoming';
  defaultLanguage?: string;
  localized?: {
    title: string;
    description: string;
  };
  defaultAudioLanguage?: string;
}

/** YouTube Video Item */
export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubeVideoSnippet;
  contentDetails?: YouTubeVideoContentDetails;
  statistics?: YouTubeVideoStatistics;
}

/** YouTube Videos List Response */
export interface YouTubeVideosResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoItem[];
}

// ============================================
// KidsMap Shorts Types
// ============================================

/** Shorts video for KidsMap feed */
export interface KidsMapShort {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: number; // seconds
  viewCount: number;
  likeCount: number;
  isShort: boolean; // duration < 60s and vertical
  relatedPlace?: {
    id: string;
    name: string;
    distance?: number;
  };
}

/** Search parameters for Shorts */
export interface ShortsSearchParams {
  /** Place name keyword (e.g., "뽀로로파크 강남") */
  placeKeyword: string;
  /** Additional child-related keywords */
  childKeywords?: string[];
  /** Maximum results to return */
  maxResults?: number;
  /** Page token for pagination */
  pageToken?: string;
  /** Region code (default: KR) */
  regionCode?: string;
}

/** Shorts search result */
export interface ShortsSearchResult {
  shorts: KidsMapShort[];
  nextPageToken?: string;
  totalResults: number;
  source: 'youtube' | 'cache';
}

/** Cached shorts data in Supabase */
export interface CachedShortsData {
  id: string;
  place_id: string;
  youtube_id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  duration: number;
  fetched_at: string;
  expires_at: string;
}

// ============================================
// API Error Types
// ============================================

/** YouTube API Error */
export interface YouTubeApiError {
  code: number;
  message: string;
  errors?: {
    message: string;
    domain: string;
    reason: string;
  }[];
  status?: string;
}

/** API Error Response */
export interface YouTubeErrorResponse {
  error: YouTubeApiError;
}

// ============================================
// Utility Types
// ============================================

/** ISO 8601 Duration parser result */
export interface ParsedDuration {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}
