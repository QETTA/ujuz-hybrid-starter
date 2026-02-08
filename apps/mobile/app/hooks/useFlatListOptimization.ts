/**
 * Optimized FlatList Hooks
 *
 * Provides performance-optimized configurations and callbacks
 * for FlatList components
 */

import { useCallback, useMemo, useRef } from 'react';
import { FlatListProps, ViewToken } from 'react-native';

/**
 * Hook to provide optimized FlatList props
 */
export function useOptimizedFlatList<T>({
  itemHeight,
  separatorHeight = 0,
}: {
  itemHeight: number;
  separatorHeight?: number;
}) {
  const getItemLayout = useCallback(
    (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight + separatorHeight,
      offset: (itemHeight + separatorHeight) * index,
      index,
    }),
    [itemHeight, separatorHeight]
  );

  const optimizedProps: Partial<FlatListProps<T>> = useMemo(
    () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      windowSize: 21,
      initialNumToRender: 10,
      getItemLayout,
    }),
    [getItemLayout]
  );

  return optimizedProps;
}

/**
 * Hook for viewability tracking with stable callbacks
 */
export function useViewabilityTracking<T>({
  onViewableItemsChanged,
  viewabilityConfig = { itemVisiblePercentThreshold: 50 },
}: {
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: FlatListProps<T>['viewabilityConfig'];
}) {
  const viewabilityConfigRef = useRef(viewabilityConfig);

  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      onViewableItemsChangedRef.current?.(info);
    },
    []
  );

  return {
    viewabilityConfig: viewabilityConfigRef.current,
    onViewableItemsChanged: handleViewableItemsChanged,
  };
}

/**
 * Hook for managing list scroll state
 */
export function useScrollState() {
  const isScrolling = useRef(false);
  const scrollVelocity = useRef(0);

  const onScrollBeginDrag = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    isScrolling.current = false;
  }, []);

  const onMomentumScrollBegin = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const onMomentumScrollEnd = useCallback(() => {
    isScrolling.current = false;
  }, []);

  return {
    isScrolling,
    scrollVelocity,
    scrollHandlers: {
      onScrollBeginDrag,
      onScrollEndDrag,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
    },
  };
}

/**
 * Hook for infinite scroll pagination
 */
export function usePagination<T>({
  pageSize = 20,
  threshold = 0.5,
}: {
  pageSize?: number;
  threshold?: number;
} = {}) {
  const hasMore = useRef(true);
  const isLoading = useRef(false);
  const currentPage = useRef(0);

  const onEndReached = useCallback(
    (loadMore: () => Promise<T[]>) => {
      if (!hasMore.current || isLoading.current) return;

      isLoading.current = true;
      currentPage.current += 1;

      loadMore()
        .then((items) => {
          if (items.length < pageSize) {
            hasMore.current = false;
          }
        })
        .finally(() => {
          isLoading.current = false;
        });
    },
    [pageSize]
  );

  const reset = useCallback(() => {
    hasMore.current = true;
    isLoading.current = false;
    currentPage.current = 0;
  }, []);

  return {
    onEndReached,
    onEndReachedThreshold: threshold,
    reset,
    hasMore,
    isLoading,
    currentPage,
  };
}
