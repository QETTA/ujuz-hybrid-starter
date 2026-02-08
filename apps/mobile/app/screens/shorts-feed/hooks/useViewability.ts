/**
 * useViewability Hook
 *
 * Tracks which video is currently visible in the feed
 */

import { useState, useCallback, useRef } from 'react';
import type { ViewToken } from 'react-native';

export function useViewability() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return {
    currentIndex,
    handleViewableItemsChanged,
    viewabilityConfig,
  };
}
