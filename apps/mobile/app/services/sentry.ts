/**
 * Sentry Configuration for UJUz Mobile (Mock)
 *
 * Re-exports from monitoring/sentry.ts to maintain compatibility
 */

export {
  initSentry,
  initializeSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  withScope,
  reportErrorBoundary,
  useSentryCapture,
} from './monitoring/sentry';

// Alias for compatibility
export { captureException as captureError } from './monitoring/sentry';
export { setUser as setUserContext } from './monitoring/sentry';

export const clearUserContext = () => {
  // Mock: just log in dev
  if (__DEV__) {
    console.log('[Sentry Mock] User context cleared');
  }
};

export { default } from './monitoring/sentry';
