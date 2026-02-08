/**
 * YouTube Services
 *
 * Exports for YouTube Data API integration
 */

export {
  youtubeApiClient,
  parseDuration,
  isShortVideo,
  getBestThumbnail,
  formatViewCount,
} from './client';
export { shortsService } from './shortsService';
export * from './types';
