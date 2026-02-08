/**
 * useVideoActions Hook
 *
 * Manages video interaction actions: like, save, share, comment
 */

import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import type { ShortsVideo } from '../types';

export function useVideoActions(video: ShortsVideo) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLiked((prev) => !prev);
  }, []);

  const handleComment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Comments functionality - future enhancement
  }, []);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync('', {
        mimeType: 'text/plain',
        dialogTitle: video.title,
      });
    }
  }, [video.title]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaved((prev) => !prev);
  }, []);

  return {
    liked,
    saved,
    handleLike,
    handleComment,
    handleShare,
    handleSave,
  };
}
