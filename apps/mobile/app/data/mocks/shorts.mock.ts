/**
 * Mock Shorts Data
 *
 * Centralized mock data for shorts video feed
 */

import type { ShortsVideo } from '@/app/screens/shorts-feed/types';

/**
 * MOCK_SHORTS - ShortsFeedScreen video data
 * Uses embed-allowed YouTube videos for development
 */
export const MOCK_SHORTS: ShortsVideo[] = [
  {
    id: 'short-1',
    youtubeId: 'L_jWHffIx5E', // Smash Mouth - All Star (embed allowed)
    title: '키즈카페 현장 영상',
    author: '엄마A',
    likes: 1234,
    comments: 89,
    shares: 56,
    relatedPlace: {
      id: 'place-1',
      name: '키즈카페 뽀로로파크 강남점',
      distance: 1200,
    },
  },
  {
    id: 'short-2',
    youtubeId: 'kJQP7kiw5Fk', // Luis Fonsi - Despacito (embed allowed)
    title: '어린이대공원 놀이터',
    author: '엄마B',
    likes: 2345,
    comments: 134,
    shares: 78,
    relatedPlace: {
      id: 'place-2',
      name: '어린이대공원',
      distance: 3500,
    },
  },
  {
    id: 'short-3',
    youtubeId: 'JGwWNGJdvx8', // Ed Sheeran - Shape of You (embed allowed)
    title: '박물관 체험 후기',
    author: '엄마C',
    likes: 890,
    comments: 45,
    shares: 23,
    relatedPlace: {
      id: 'place-3',
      name: '국립중앙박물관 어린이박물관',
      distance: 2100,
    },
  },
];
