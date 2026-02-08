/**
 * YouTube Shorts Service
 *
 * Service for searching and fetching YouTube Shorts
 * related to kid-friendly places
 */

import youtubeApiClient, { parseDuration, isShortVideo, getBestThumbnail } from './client';
import type {
  ShortsSearchParams,
  ShortsSearchResult,
  KidsMapShort,
  YouTubeVideoItem,
} from './types';

// ============================================
// Constants
// ============================================

/** Default child-related keywords for better search results */
const DEFAULT_CHILD_KEYWORDS = ['아기', '육아', '키즈', '아이와', '가족'];

// NOTE: EXCLUDE_KEYWORDS for future content filtering
// ['광고', '리뷰', '후기만'] - to be implemented in content filter

// ============================================
// Shorts Service
// ============================================

export const shortsService = {
  /**
   * Search for Shorts related to a place
   *
   * Flow:
   * 1. Search videos with place keyword + child keywords
   * 2. Filter by duration < 60s (Shorts)
   * 3. Get video details (statistics)
   * 4. Return mapped KidsMapShort objects
   */
  async searchByPlace(params: ShortsSearchParams): Promise<ShortsSearchResult> {
    const {
      placeKeyword,
      childKeywords = DEFAULT_CHILD_KEYWORDS,
      maxResults = 10,
      pageToken,
      regionCode = 'KR',
    } = params;

    // Build search query
    const searchQuery = buildSearchQuery(placeKeyword, childKeywords);

    if (__DEV__) {
      console.log(`[ShortsService] Searching: "${searchQuery}"`);
    }

    try {
      // Step 1: Search for short videos
      const searchResponse = await youtubeApiClient.search({
        q: searchQuery,
        type: 'video',
        videoDuration: 'short', // < 4 minutes, will filter further
        maxResults: maxResults * 2, // Get more to filter
        pageToken,
        regionCode,
        order: 'relevance',
      });

      if (searchResponse.items.length === 0) {
        return {
          shorts: [],
          totalResults: 0,
          source: 'youtube',
        };
      }

      // Extract video IDs
      const videoIds = searchResponse.items
        .map((item) => item.id.videoId)
        .filter((id): id is string => Boolean(id));

      // Step 2: Get video details (duration, statistics)
      const videosResponse = await youtubeApiClient.getVideos({
        ids: videoIds,
        parts: ['snippet', 'contentDetails', 'statistics'],
      });

      // Step 3: Filter actual Shorts (< 60 seconds) and map
      const shorts = videosResponse.items
        .filter((video) => {
          if (!video.contentDetails?.duration) return false;
          return isShortVideo(video.contentDetails.duration);
        })
        .map((video) => mapVideoToShort(video, placeKeyword))
        .slice(0, maxResults);

      if (__DEV__) {
        console.log(`[ShortsService] Found ${shorts.length} Shorts for "${placeKeyword}"`);
      }

      return {
        shorts,
        nextPageToken: searchResponse.nextPageToken,
        totalResults: searchResponse.pageInfo.totalResults,
        source: 'youtube',
      };
    } catch (error) {
      console.error('[ShortsService] Search failed:', error);
      throw error;
    }
  },

  /**
   * Get Shorts by specific YouTube IDs
   */
  async getByIds(videoIds: string[]): Promise<KidsMapShort[]> {
    if (videoIds.length === 0) return [];

    try {
      const response = await youtubeApiClient.getVideos({
        ids: videoIds,
        parts: ['snippet', 'contentDetails', 'statistics'],
      });

      return response.items
        .filter((video) => {
          if (!video.contentDetails?.duration) return false;
          return isShortVideo(video.contentDetails.duration);
        })
        .map((video) => mapVideoToShort(video));
    } catch (error) {
      console.error('[ShortsService] getByIds failed:', error);
      throw error;
    }
  },

  /**
   * Search trending Shorts for kids/family content
   */
  async getTrendingKidsShorts(maxResults = 20): Promise<KidsMapShort[]> {
    const trendingKeywords = ['키즈카페 브이로그', '아이와 나들이', '육아 일상', '아기 놀이터'];

    const allShorts: KidsMapShort[] = [];

    for (const keyword of trendingKeywords) {
      try {
        const result = await this.searchByPlace({
          placeKeyword: keyword,
          maxResults: Math.ceil(maxResults / trendingKeywords.length),
        });
        allShorts.push(...result.shorts);
      } catch (error) {
        console.warn(`[ShortsService] Failed to get trending for "${keyword}":`, error);
      }
    }

    // Sort by view count and deduplicate
    const uniqueShorts = deduplicateShorts(allShorts);
    return uniqueShorts.sort((a, b) => b.viewCount - a.viewCount).slice(0, maxResults);
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Build search query with place and child keywords
 */
function buildSearchQuery(placeKeyword: string, childKeywords: string[]): string {
  // Take 2 random child keywords for variety
  const selectedKeywords = childKeywords.sort(() => Math.random() - 0.5).slice(0, 2);

  return `${placeKeyword} ${selectedKeywords.join(' ')}`;
}

/**
 * Map YouTube video to KidsMapShort
 */
function mapVideoToShort(video: YouTubeVideoItem, placeName?: string): KidsMapShort {
  const duration = video.contentDetails?.duration
    ? parseDuration(video.contentDetails.duration).totalSeconds
    : 0;

  return {
    id: `yt-${video.id}`,
    youtubeId: video.id,
    title: video.snippet?.title || '',
    description: video.snippet?.description || '',
    channelId: video.snippet?.channelId || '',
    channelTitle: video.snippet?.channelTitle || '',
    publishedAt: video.snippet?.publishedAt || '',
    thumbnailUrl: video.snippet?.thumbnails ? getBestThumbnail(video.snippet.thumbnails) : '',
    duration,
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
    likeCount: parseInt(video.statistics?.likeCount || '0', 10),
    isShort: duration <= 60,
    relatedPlace: placeName
      ? {
          id: '', // Will be linked later
          name: placeName,
        }
      : undefined,
  };
}

/**
 * Remove duplicate shorts by YouTube ID
 */
function deduplicateShorts(shorts: KidsMapShort[]): KidsMapShort[] {
  const seen = new Set<string>();
  return shorts.filter((short) => {
    if (seen.has(short.youtubeId)) return false;
    seen.add(short.youtubeId);
    return true;
  });
}

export default shortsService;
