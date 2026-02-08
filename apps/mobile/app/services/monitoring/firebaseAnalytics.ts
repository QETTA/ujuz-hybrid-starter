/**
 * Firebase Analytics Integration (Mock for Development)
 *
 * Note: Firebase disabled due to package issues.
 * Re-enable when @react-native-firebase is properly installed.
 */

// ═══════════════════════════════════════════════════════════
// MOCK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

export async function initializeAnalytics(): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Initialized');
  }
}

export async function logScreenView(screenName: string, _screenClass?: string): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Screen:', screenName);
  }
}

export async function logEvent(eventName: string, params?: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Event:', eventName, params);
  }
}

export async function logSelectContent(contentType: string, itemId: string): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Select:', contentType, itemId);
  }
}

export async function logSearch(params: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Search:', params);
  }
}

export async function logShare(contentType: string, itemId: string, method: string): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Share:', contentType, itemId, method);
  }
}

export async function setUserId(userId: string | null): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] User ID:', userId);
  }
}

export async function setUserProperty(name: string, value: string | null): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] User Property:', name, value);
  }
}

export async function logPlaceView(params: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Place View:', params);
  }
}

export async function logPlaceAction(
  action: string,
  placeId: string,
  _placeName: string
): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Place Action:', action, placeId);
  }
}

export async function logFilterApply(filters: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Filter:', filters);
  }
}

// Alias for compatibility
export const logFilterApplied = logFilterApply;

export async function logMapInteraction(
  action: string,
  _data?: Record<string, unknown>
): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Map:', action);
  }
}

export async function logError(errorName: string, errorMessage: string): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Error:', errorName, errorMessage);
  }
}

export async function logVideoWatch(params: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Video Watch:', params);
  }
}

export async function logSavePlace(params: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Save Place:', params);
  }
}

export async function logGroupBuyView(params: Record<string, unknown>): Promise<void> {
  if (__DEV__) {
    console.log('[Analytics Mock] Group Buy View:', params);
  }
}

export default {
  initializeAnalytics,
  logScreenView,
  logEvent,
  logSelectContent,
  logSearch,
  logShare,
  setUserId,
  setUserProperty,
  logPlaceView,
  logPlaceAction,
  logFilterApply,
  logFilterApplied,
  logMapInteraction,
  logError,
  logVideoWatch,
  logSavePlace,
  logGroupBuyView,
};
