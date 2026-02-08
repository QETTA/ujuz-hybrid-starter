/**
 * Shorts Feed Types
 */

export interface ShortsVideo {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  authorAvatar?: string;
  likes: number;
  comments: number;
  shares: number;
  relatedPlace: {
    id: string;
    name: string;
    distance: number;
  };
}
