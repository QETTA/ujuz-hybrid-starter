/**
 * Offline Support Hook
 *
 * Provides offline-first functionality with local caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface CacheConfig {
  /** Cache key prefix */
  key: string;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Whether to use cached data when online */
  staleWhileRevalidate?: boolean;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Hook for offline-first data fetching with caching
 */
export function useOfflineData<T>({
  fetcher,
  cacheConfig,
  enabled = true,
}: {
  fetcher: () => Promise<T>;
  cacheConfig: CacheConfig;
  enabled?: boolean;
}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const isMounted = useRef(true);
  const cacheKey = `@ujuz_cache_${cacheConfig.key}`;

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
      isMounted.current = false;
    };
  }, []);

  // Load from cache
  const loadFromCache = useCallback(async (): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsed: CachedData<T> = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > parsed.ttl;

      if (isExpired && !cacheConfig.staleWhileRevalidate) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }, [cacheKey, cacheConfig.staleWhileRevalidate]);

  // Save to cache
  const saveToCache = useCallback(
    async (newData: T) => {
      try {
        const cached: CachedData<T> = {
          data: newData,
          timestamp: Date.now(),
          ttl: cacheConfig.ttl ?? 1000 * 60 * 60, // Default 1 hour
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
      } catch {
        // Silently fail cache writes
      }
    },
    [cacheKey, cacheConfig.ttl]
  );

  // Fetch data
  const fetchData = useCallback(
    async (force = false) => {
      if (!enabled) return;

      setIsLoading(true);
      setError(null);

      // Try cache first if not forcing refresh
      if (!force) {
        const cachedData = await loadFromCache();
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);

          // If stale-while-revalidate, continue to fetch in background
          if (!cacheConfig.staleWhileRevalidate) {
            setIsLoading(false);
            return;
          }
        }
      }

      // Check network
      if (!isOnline) {
        if (!data) {
          setError(new Error('No cached data available offline'));
        }
        setIsLoading(false);
        return;
      }

      // Fetch from network
      try {
        const freshData = await fetcher();
        if (isMounted.current) {
          setData(freshData);
          setIsFromCache(false);
          await saveToCache(freshData);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          // Keep showing cached data on error
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [enabled, isOnline, data, fetcher, loadFromCache, saveToCache, cacheConfig.staleWhileRevalidate]
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && error) {
      fetchData(true);
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear cache
  const clearCache = useCallback(async () => {
    await AsyncStorage.removeItem(cacheKey);
    setData(null);
    setIsFromCache(false);
  }, [cacheKey]);

  // Manual refresh
  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    isOnline,
    refresh,
    clearCache,
  };
}

/**
 * Hook to manage pending offline actions
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<
    { id: string; action: () => Promise<any>; timestamp: number }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add action to queue
  const addToQueue = useCallback((action: () => Promise<any>) => {
    const id = Date.now().toString();
    setQueue((prev) => [...prev, { id, action, timestamp: Date.now() }]);
    return id;
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Process queue when online
  const processQueue = useCallback(async () => {
    if (isProcessing || queue.length === 0) return;

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    setIsProcessing(true);

    for (const item of queue) {
      try {
        await item.action();
        removeFromQueue(item.id);
      } catch {
        // Keep in queue for retry
      }
    }

    setIsProcessing(false);
  }, [queue, isProcessing, removeFromQueue]);

  // Auto-process when coming online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && queue.length > 0) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, [queue.length, processQueue]);

  return {
    queue,
    queueLength: queue.length,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
  };
}
