/**
 * YouTube Data API v3 Client
 *
 * HTTP client for YouTube API with:
 * - Retry logic with exponential backoff
 * - Error handling
 * - Quota management awareness
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { YOUTUBE_API_KEY as ENV_YOUTUBE_API_KEY } from '@env';
import type {
  YouTubeSearchResponse,
  YouTubeVideosResponse,
  YouTubeErrorResponse,
  ParsedDuration,
} from './types';

// ============================================
// Configuration
// ============================================

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Get API key from environment
const YOUTUBE_API_KEY = ENV_YOUTUBE_API_KEY || '';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 5000,
};

// ============================================
// API Client Class
// ============================================

class YouTubeApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = YOUTUBE_API_KEY;
    this.client = axios.create({
      baseURL: YOUTUBE_API_BASE_URL,
      timeout: 15000,
      headers: {
        Accept: 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<YouTubeErrorResponse>) => {
        if (error.response?.data?.error) {
          const apiError = error.response.data.error;
          console.error('[YouTubeAPI] Error:', apiError.message, apiError.code);

          // Handle specific error codes
          if (apiError.code === 403) {
            console.error('[YouTubeAPI] Quota exceeded or API key invalid');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Execute request with retry logic
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on quota exceeded or invalid API key
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          throw error;
        }

        if (attempt < RETRY_CONFIG.maxRetries) {
          console.warn(`[YouTubeAPI] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Search for videos
   * Cost: 100 units per call
   */
  async search(params: {
    q: string;
    type?: 'video' | 'channel' | 'playlist';
    videoDuration?: 'any' | 'short' | 'medium' | 'long';
    maxResults?: number;
    pageToken?: string;
    regionCode?: string;
    relevanceLanguage?: string;
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
  }): Promise<YouTubeSearchResponse> {
    if (!this.isConfigured()) {
      throw new Error('YouTube API key not configured');
    }

    return this.withRetry(async () => {
      const response = await this.client.get<YouTubeSearchResponse>('/search', {
        params: {
          key: this.apiKey,
          part: 'snippet',
          type: params.type || 'video',
          videoDuration: params.videoDuration,
          maxResults: params.maxResults || 10,
          pageToken: params.pageToken,
          regionCode: params.regionCode || 'KR',
          relevanceLanguage: params.relevanceLanguage || 'ko',
          order: params.order || 'relevance',
          q: params.q,
          // Additional filters for better Shorts detection
          ...(params.videoDuration === 'short' && {
            videoDefinition: 'any',
            videoEmbeddable: 'true',
          }),
        },
      });

      if (__DEV__) {
        console.log(`[YouTubeAPI] Search returned ${response.data.items.length} results`);
      }

      return response.data;
    });
  }

  /**
   * Get video details by IDs
   * Cost: 1 unit per call
   */
  async getVideos(params: {
    ids: string[];
    parts?: ('snippet' | 'contentDetails' | 'statistics')[];
  }): Promise<YouTubeVideosResponse> {
    if (!this.isConfigured()) {
      throw new Error('YouTube API key not configured');
    }

    if (params.ids.length === 0) {
      return {
        kind: 'youtube#videoListResponse',
        etag: '',
        pageInfo: { totalResults: 0, resultsPerPage: 0 },
        items: [],
      };
    }

    return this.withRetry(async () => {
      const response = await this.client.get<YouTubeVideosResponse>('/videos', {
        params: {
          key: this.apiKey,
          part: (params.parts || ['snippet', 'contentDetails', 'statistics']).join(','),
          id: params.ids.join(','),
        },
      });

      if (__DEV__) {
        console.log(`[YouTubeAPI] Videos returned ${response.data.items.length} results`);
      }

      return response.data;
    });
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Parse ISO 8601 duration string to seconds
 * Example: "PT1M30S" -> 90 seconds
 */
export function parseDuration(duration: string): ParsedDuration {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return { hours, minutes, seconds, totalSeconds };
}

/**
 * Check if video is a Short (< 60 seconds)
 */
export function isShortVideo(durationString: string): boolean {
  const { totalSeconds } = parseDuration(durationString);
  return totalSeconds > 0 && totalSeconds <= 60;
}

/**
 * Get best available thumbnail URL
 * Prefers vertical thumbnails for Shorts
 */
export function getBestThumbnail(
  thumbnails: YouTubeSearchResponse['items'][0]['snippet']['thumbnails']
): string {
  // Priority: maxres > high > medium > default
  return (
    thumbnails.maxres?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ''
  );
}

/**
 * Format view count for display
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// ============================================
// Export singleton instance
// ============================================

export const youtubeApiClient = new YouTubeApiClient();
export default youtubeApiClient;
