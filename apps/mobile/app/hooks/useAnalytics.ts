/**
 * Analytics Hook (Firebase Analytics Integrated)
 * Track user interactions and app usage
 *
 * @description Production-ready analytics with Firebase integration
 */

import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Analytics from '../services/monitoring/firebaseAnalytics';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

// In-memory event queue (for offline support + debugging)
const eventQueue: AnalyticsEvent[] = [];

/**
 * Track analytics events with Firebase integration
 *
 * @param screenName - Current screen name for automatic tracking
 * @returns Analytics tracking functions
 */
export function useAnalytics(screenName: string) {
  const startTime = useRef(Date.now());
  const appState = useRef(AppState.currentState);

  // Track screen view with Firebase
  useEffect(() => {
    // Firebase screen tracking
    Analytics.logScreenView(screenName, screenName);

    // Legacy event queue (for offline/debugging)
    trackEvent({
      category: 'Navigation',
      action: 'ScreenView',
      label: screenName,
    });

    // Track time spent on screen
    return () => {
      const duration = Date.now() - startTime.current;
      trackEvent({
        category: 'Navigation',
        action: 'ScreenDuration',
        label: screenName,
        value: duration,
      });
    };
  }, [screenName]);

  // Track app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        trackEvent({
          category: 'App',
          action: 'Foreground',
          label: screenName,
        });
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        trackEvent({
          category: 'App',
          action: 'Background',
          label: screenName,
        });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [screenName]);

  const trackInteraction = useCallback(
    (action: string, label?: string, value?: number) => {
      trackEvent({
        category: 'Interaction',
        action,
        label: label || screenName,
        value,
      });
    },
    [screenName]
  );

  const trackSearch = useCallback((query: string, resultCount: number) => {
    // Firebase search tracking
    Analytics.logSearch({
      search_term: query,
      results_count: resultCount,
    });

    trackEvent({
      category: 'Search',
      action: 'Query',
      label: query,
      value: resultCount,
    });
  }, []);

  const trackPlaceView = useCallback((placeId: string, placeName: string, category?: string) => {
    // Firebase place view tracking
    Analytics.logPlaceView({
      place_id: placeId,
      place_name: placeName,
      category: category || 'general',
    });

    trackEvent({
      category: 'Place',
      action: 'View',
      label: `${placeName} (${placeId})`,
    });
  }, []);

  const trackFilter = useCallback(
    (filterType: string, filterValue: string, resultCount?: number) => {
      // Firebase filter tracking
      Analytics.logFilterApplied({
        filter_type: filterType,
        filter_value: filterValue,
        results_count: resultCount || 0,
      });

      trackEvent({
        category: 'Filter',
        action: filterType,
        label: filterValue,
      });
    },
    []
  );

  const trackError = useCallback(
    (errorMessage: string, errorContext?: string) => {
      trackEvent({
        category: 'Error',
        action: errorMessage,
        label: errorContext || screenName,
      });
    },
    [screenName]
  );

  // New: Video watch tracking
  const trackVideoWatch = useCallback(
    (params: {
      videoId: string;
      placeId: string;
      placeName: string;
      durationSeconds?: number;
      completed?: boolean;
    }) => {
      Analytics.logVideoWatch({
        video_id: params.videoId,
        place_id: params.placeId,
        place_name: params.placeName,
        duration_seconds: params.durationSeconds,
        completed: params.completed,
      });

      trackEvent({
        category: 'Video',
        action: params.completed ? 'Complete' : 'Watch',
        label: params.placeName,
        value: params.durationSeconds,
      });
    },
    []
  );

  // New: Save/favorite tracking
  const trackSavePlace = useCallback(
    (params: {
      placeId: string;
      placeName: string;
      category: string;
      action: 'save' | 'unsave';
    }) => {
      Analytics.logSavePlace({
        place_id: params.placeId,
        place_name: params.placeName,
        category: params.category,
        action: params.action,
      });

      trackEvent({
        category: 'Favorite',
        action: params.action,
        label: params.placeName,
      });
    },
    []
  );

  // New: Group buy tracking
  const trackGroupBuyView = useCallback(
    (params: {
      groupBuyId: string;
      placeId: string;
      placeName: string;
      discountPercentage: number;
      currentParticipants: number;
      maxParticipants: number;
    }) => {
      Analytics.logGroupBuyView({
        group_buy_id: params.groupBuyId,
        place_id: params.placeId,
        place_name: params.placeName,
        discount_percentage: params.discountPercentage,
        current_participants: params.currentParticipants,
        max_participants: params.maxParticipants,
      });
    },
    []
  );

  return {
    trackInteraction,
    trackSearch,
    trackPlaceView,
    trackFilter,
    trackError,
    // New Firebase-integrated methods
    trackVideoWatch,
    trackSavePlace,
    trackGroupBuyView,
  };
}

/**
 * Track a custom event (with optional Firebase forwarding)
 */
export function trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>) {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: Date.now(),
  };

  eventQueue.push(fullEvent);

  // Log in development
  if (__DEV__) {
    console.log('[Analytics]', fullEvent);
  }

  // Forward to Firebase as custom event
  Analytics.logEvent(`${event.category.toLowerCase()}_${event.action.toLowerCase()}`, {
    label: event.label,
    value: event.value,
  });
}

/**
 * Get tracked events (for debugging)
 */
export function getTrackedEvents(): AnalyticsEvent[] {
  return [...eventQueue];
}

/**
 * Clear event queue
 */
export function clearEventQueue() {
  eventQueue.length = 0;
}
