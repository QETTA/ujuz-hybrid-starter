/**
 * Performance Optimization Utilities
 *
 * Memoization, lazy loading, and render optimization helpers
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Hook to track re-renders in development
 * Use this to identify unnecessary re-renders
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);
  renderCount.current += 1;

  if (__DEV__) {
    console.log(`[Render] ${componentName}: ${renderCount.current}`);
  }

  return renderCount.current;
}

/**
 * Hook to compare previous and current props for debugging
 */
export function useWhyDidYouUpdate<T extends Record<string, any>>(name: string, props: T): void {
  const previousProps = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (__DEV__ && previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${name}:`, changedProps);
      }
    }
    previousProps.current = props;
  });
}

/**
 * Deferred execution after interactions complete
 * Use for expensive operations that can wait
 */
export function runAfterInteractions(task: () => void): { cancel: () => void } {
  return InteractionManager.runAfterInteractions(task);
}

/**
 * Simple debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Simple throttle function
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoized callback with stable reference
 * Unlike useCallback, this always returns the same function reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}

/**
 * Compare two objects shallowly
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!objB.hasOwnProperty(key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Batch state updates
 * Groups multiple state updates to avoid multiple re-renders
 * Note: React 18+ batches updates automatically
 */
export function batchUpdates(callback: () => void): void {
  callback();
}

/**
 * List optimization helpers
 */
export const ListOptimization = {
  /**
   * Generate keyExtractor function with caching
   */
  createKeyExtractor: <T extends { id: string | number }>(prefix: string = 'item') => {
    const cache = new Map<string | number, string>();

    return (item: T, _index: number): string => {
      if (!cache.has(item.id)) {
        cache.set(item.id, `${prefix}-${item.id}`);
      }
      return cache.get(item.id)!;
    };
  },

  /**
   * Default FlatList optimization props
   */
  defaultProps: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    windowSize: 21,
    initialNumToRender: 10,
    getItemLayout: undefined, // Should be provided per list if heights are fixed
  },

  /**
   * Calculate getItemLayout for fixed-height items
   */
  createGetItemLayout: (itemHeight: number, separatorHeight: number = 0) => {
    return (_data: any, index: number) => ({
      length: itemHeight + separatorHeight,
      offset: (itemHeight + separatorHeight) * index,
      index,
    });
  },
};

/**
 * Image optimization helpers
 */
export const ImageOptimization = {
  /**
   * Get appropriate image size based on device
   */
  getOptimalSize: (originalWidth: number, containerWidth: number): number => {
    const pixelRatio = 2; // Assume retina, could use PixelRatio.get()
    return Math.min(originalWidth, containerWidth * pixelRatio);
  },

  /**
   * Preload images
   */
  preload: async (urls: string[]): Promise<void> => {
    // expo-image handles caching, but we can hint at priority
    await Promise.all(urls.map((url) => fetch(url, { method: 'HEAD' })));
  },
};

/**
 * Component lazy loading helper
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> } {
  const Component = React.lazy(factory) as any;
  Component.preload = factory;
  return Component;
}
