/**
 * Sentry Error Tracking Integration
 *
 * GitHub Student Pack: 50K errors/month FREE
 * https://sentry.io
 */

import * as Sentry from '@sentry/react-native';

// Types
type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// Scope type for withScope callback
interface SentryScope {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  setContext: (key: string, value: unknown) => void;
  setExtras: (extras: Record<string, unknown>) => void;
}

// ═══════════════════════════════════════════════════════════
// REAL SENTRY IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;

  // DSN이 없으면 Mock 모드
  if (!dsn) {
    if (__DEV__) {
      console.log('[Sentry] No DSN configured - running in mock mode');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    beforeSend(event) {
      // 민감 정보 필터링
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['x-api-key'];
      }
      return event;
    },
  });
};

export const initializeSentry = initSentry;

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  if (!process.env.SENTRY_DSN) {
    if (__DEV__) console.error('[Sentry Mock] Exception:', error.message);
    return;
  }

  if (context) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (message: string, level?: SeverityLevel) => {
  if (!process.env.SENTRY_DSN) {
    if (__DEV__) console.log(`[Sentry Mock] ${level || 'info'}: ${message}`);
    return;
  }

  Sentry.captureMessage(message, {
    level: level as 'fatal' | 'error' | 'warning' | 'info' | 'debug',
  });
};

export const setUser = (user: { id?: string; email?: string; username?: string } | null) => {
  if (!process.env.SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry Mock] Set user:', user);
    return;
  }

  Sentry.setUser(user);
};

export const addBreadcrumb = (breadcrumb: {
  category?: string;
  message?: string;
  level?: SeverityLevel;
  data?: Record<string, unknown>;
}) => {
  if (!process.env.SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry Mock] Breadcrumb:', breadcrumb.category, breadcrumb.message);
    return;
  }

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level as 'fatal' | 'error' | 'warning' | 'info' | 'debug',
    data: breadcrumb.data,
  });
};

export const startTransaction = (_context: { name: string; op?: string }) => {
  // Sentry v8 uses startSpan - return mock for compatibility
  return {
    finish: () => {},
    setStatus: () => {},
    startChild: () => ({ finish: () => {} }),
  };
};

export const withScope = (callback: (scope: SentryScope) => void) => {
  if (!process.env.SENTRY_DSN) {
    callback({
      setTag: () => {},
      setExtra: () => {},
      setContext: () => {},
      setExtras: () => {},
    });
    return;
  }

  Sentry.withScope((scope: unknown) => {
    const s = scope as {
      setTag: (k: string, v: string) => void;
      setExtra: (k: string, v: unknown) => void;
      setContext: (k: string, v: Record<string, unknown>) => void;
      setExtras: (e: Record<string, unknown>) => void;
    };
    callback({
      setTag: (key, value) => s.setTag(key, value),
      setExtra: (key, value) => s.setExtra(key, value),
      setContext: (key, value) => s.setContext(key, value as Record<string, unknown>),
      setExtras: (extras) => s.setExtras(extras),
    });
  });
};

export const reportErrorBoundary = (error: Error, componentStack?: string, eventId?: string) => {
  if (!process.env.SENTRY_DSN) {
    if (__DEV__) console.error('[Sentry Mock] ErrorBoundary:', error.message);
    return;
  }

  Sentry.captureException(error, {
    extra: { componentStack, eventId },
  });
};

export const useSentryCapture = () => {
  return {
    captureException,
    captureMessage,
  };
};

// Export for compatibility
export default {
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
};
