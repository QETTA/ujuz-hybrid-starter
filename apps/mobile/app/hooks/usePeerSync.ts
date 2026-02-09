/**
 * usePeerSync Hook
 *
 * 2026 UJUz 킬러 기능: 또래 동기화 데이터 훅
 * - 실시간 또래 상태 조회
 * - 또래 활동 피드 조회
 * - 또래 트렌드 조회
 * - 자동 polling으로 실시간 업데이트
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { peerSyncService } from '@/app/services/mongo';
import type { PeerLiveStatus, PeerActivity, PeerTrends, TrendPeriod } from '@/app/types/peerSync';

// ============================================
// Configuration
// ============================================

const STATUS_POLLING_INTERVAL = 15000; // 15 seconds
const ACTIVITY_POLLING_INTERVAL = 30000; // 30 seconds
const TREND_POLLING_INTERVAL = 60000; // 1 minute
const MAX_BACKOFF_INTERVAL = 120000; // 2 minutes max backoff
const BACKOFF_MULTIPLIER = 2;
const BACKOFF_THRESHOLD = 2; // consecutive failures before backoff kicks in

// ============================================
// Types
// ============================================

export interface UsePeerSyncOptions {
  /** 아이 나이 (개월) */
  childAgeMonths: number;
  /** 사용자 위치 (위도) */
  userLat?: number;
  /** 사용자 위치 (경도) */
  userLng?: number;
  /** 폴링 활성화 여부 */
  enablePolling?: boolean;
}

export interface UsePeerSyncResult {
  /** 실시간 또래 현황 */
  liveStatus: PeerLiveStatus | null;
  /** 최근 또래 활동 */
  activities: PeerActivity[];
  /** 또래 트렌드 */
  trends: PeerTrends | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 상태 */
  error: Error | null;
  /** 데이터 새로고침 */
  refresh: () => Promise<void>;
  /** 트렌드 기간 변경 */
  setTrendPeriod: (period: TrendPeriod) => void;
  /** 더 많은 활동 로드 */
  loadMoreActivities: () => Promise<void>;
  /** 추가 활동 로딩 중 */
  isLoadingMore: boolean;
  /** 더 많은 활동 존재 여부 */
  hasMoreActivities: boolean;
}

// ============================================
// Hook Implementation
// ============================================

export function usePeerSync(options: UsePeerSyncOptions): UsePeerSyncResult {
  const {
    childAgeMonths,
    userLat,
    userLng,
    enablePolling = true,
  } = options;

  // State
  const [liveStatus, setLiveStatus] = useState<PeerLiveStatus | null>(null);
  const [activities, setActivities] = useState<PeerActivity[]>([]);
  const [trends, setTrends] = useState<PeerTrends | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);

  // Refs for polling
  const statusPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trendPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityOffsetRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const isPollingActiveRef = useRef(false);

  // Backoff interval calculator
  const getBackoffInterval = useCallback((baseInterval: number) => {
    const failures = consecutiveFailuresRef.current;
    if (failures < BACKOFF_THRESHOLD) return baseInterval;
    const multiplier = Math.pow(BACKOFF_MULTIPLIER, failures - BACKOFF_THRESHOLD);
    return Math.min(baseInterval * multiplier, MAX_BACKOFF_INTERVAL);
  }, []);

  // Fetch live status
  const fetchLiveStatus = useCallback(async () => {
    try {
      const status = await peerSyncService.getLiveStatus(childAgeMonths, userLat, userLng);
      setLiveStatus(status);
      consecutiveFailuresRef.current = 0;
    } catch {
      consecutiveFailuresRef.current += 1;
    }
  }, [childAgeMonths, userLat, userLng]);

  // Fetch activities
  const fetchActivities = useCallback(
    async (reset = true) => {
      try {
        if (reset) {
          activityOffsetRef.current = 0;
        }

        const newActivities = await peerSyncService.getRecentActivities(
          childAgeMonths,
          20,
          activityOffsetRef.current
        );

        if (reset) {
          setActivities(newActivities);
        } else {
          setActivities((prev) => [...prev, ...newActivities]);
        }

        setHasMoreActivities(newActivities.length === 20);
        activityOffsetRef.current += newActivities.length;
      } catch {
        // Failure counted in fetchLiveStatus (primary health indicator)
      }
    },
    [childAgeMonths]
  );

  // Fetch trends
  const fetchTrends = useCallback(async () => {
    try {
      const trendData = await peerSyncService.getPeerTrends(childAgeMonths, trendPeriod);
      setTrends(trendData);
    } catch {
      // Failure counted in fetchLiveStatus (primary health indicator)
    }
  }, [childAgeMonths, trendPeriod]);

  // Initial data load
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([fetchLiveStatus(), fetchActivities(true), fetchTrends()]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load peer data'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchLiveStatus, fetchActivities, fetchTrends]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Load more activities
  const loadMoreActivities = useCallback(async () => {
    if (isLoadingMore || !hasMoreActivities) return;

    setIsLoadingMore(true);
    try {
      await fetchActivities(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchActivities, isLoadingMore, hasMoreActivities]);

  // Schedule next poll with adaptive delay (setTimeout chain, NOT setInterval)
  const scheduleStatusPoll = useCallback(() => {
    if (!isPollingActiveRef.current) return;
    const delay = getBackoffInterval(STATUS_POLLING_INTERVAL);
    statusPollingRef.current = setTimeout(async () => {
      await fetchLiveStatus();
      scheduleStatusPoll();
    }, delay);
  }, [fetchLiveStatus, getBackoffInterval]);

  const scheduleActivityPoll = useCallback(() => {
    if (!isPollingActiveRef.current) return;
    const delay = getBackoffInterval(ACTIVITY_POLLING_INTERVAL);
    activityPollingRef.current = setTimeout(async () => {
      await fetchActivities(true);
      scheduleActivityPoll();
    }, delay);
  }, [fetchActivities, getBackoffInterval]);

  const scheduleTrendPoll = useCallback(() => {
    if (!isPollingActiveRef.current) return;
    const delay = getBackoffInterval(TREND_POLLING_INTERVAL);
    trendPollingRef.current = setTimeout(async () => {
      await fetchTrends();
      scheduleTrendPoll();
    }, delay);
  }, [fetchTrends, getBackoffInterval]);

  const stopPolling = useCallback(() => {
    isPollingActiveRef.current = false;
    if (statusPollingRef.current) {
      clearTimeout(statusPollingRef.current);
      statusPollingRef.current = null;
    }
    if (activityPollingRef.current) {
      clearTimeout(activityPollingRef.current);
      activityPollingRef.current = null;
    }
    if (trendPollingRef.current) {
      clearTimeout(trendPollingRef.current);
      trendPollingRef.current = null;
    }
  }, []);

  // Setup polling
  const startPolling = useCallback(() => {
    if (!enablePolling) return;
    stopPolling();
    isPollingActiveRef.current = true;
    consecutiveFailuresRef.current = 0;
    scheduleStatusPoll();
    scheduleActivityPoll();
    scheduleTrendPoll();
  }, [enablePolling, stopPolling, scheduleStatusPoll, scheduleActivityPoll, scheduleTrendPoll]);

  // Handle app state changes (pause polling when app is in background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refresh();
        startPolling();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [refresh, startPolling, stopPolling]);

  // Initial load and polling setup
  useEffect(() => {
    loadInitialData();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [loadInitialData, startPolling, stopPolling]);

  // Refetch trends when period changes
  useEffect(() => {
    fetchTrends();
  }, [trendPeriod, fetchTrends]);

  return {
    liveStatus,
    activities,
    trends,
    isLoading,
    error,
    refresh,
    setTrendPeriod,
    loadMoreActivities,
    isLoadingMore,
    hasMoreActivities,
  };
}

export default usePeerSync;
