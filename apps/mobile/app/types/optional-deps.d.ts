// Type declarations for optional dependencies that may not be installed

declare module '@react-native-firebase/analytics' {
  interface Analytics {
    setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
    setDefaultEventParameters(params: Record<string, unknown>): Promise<void>;
    logScreenView(params: { screen_name: string; screen_class?: string }): Promise<void>;
    setUserId(userId: string | null): Promise<void>;
    setUserProperty(name: string, value: string | null): Promise<void>;
    logEvent(eventName: string, params?: Record<string, unknown>): Promise<void>;
    logSelectContent(params: { content_type: string; item_id: string }): Promise<void>;
    logSearch(params: { search_term: string }): Promise<void>;
    logShare(params: { content_type: string; item_id: string; method: string }): Promise<void>;
    logViewItem(params: Record<string, unknown>): Promise<void>;
    logBeginCheckout(params: Record<string, unknown>): Promise<void>;
    logPurchase(params: Record<string, unknown>): Promise<void>;
    logAddToCart(params: Record<string, unknown>): Promise<void>;
    logAppOpen(): Promise<void>;
    logLogin(params: { method: string }): Promise<void>;
    logSignUp(params: { method: string }): Promise<void>;
  }

  function analytics(): Analytics;
  export default analytics;
}

declare module '@sentry/react-native' {
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

  export interface ExceptionValue {
    type?: string;
    value?: string;
    stacktrace?: unknown;
  }

  export interface Event {
    request?: {
      headers?: Record<string, string>;
    };
    level?: string;
    exception?: {
      values?: ExceptionValue[];
    };
  }

  export interface Hint {
    originalException?: Error | string;
  }

  export interface Integration {
    name: string;
  }

  export interface SentryOptions {
    dsn: string;
    enabled?: boolean;
    release?: string;
    dist?: string;
    environment?: string;
    tracesSampleRate?: number;
    enableAutoSessionTracking?: boolean;
    sessionTrackingIntervalMillis?: number;
    attachStacktrace?: boolean;
    maxBreadcrumbs?: number;
    beforeSend?: (event: Event, hint: Hint) => Event | null;
    integrations?: Integration[];
  }

  export interface Transaction {
    finish(): void;
    setTag(key: string, value: string): void;
    setStatus(status: string): void;
  }

  export function init(options: SentryOptions): void;
  export function captureException(error: Error, context?: Record<string, unknown>): string;
  export function captureMessage(
    message: string,
    options?: SeverityLevel | { level?: SeverityLevel; extra?: Record<string, unknown> }
  ): string;
  export function setUser(user: { id?: string; email?: string; username?: string } | null): void;
  export function setTag(key: string, value: string): void;
  export function setExtra(key: string, value: unknown): void;
  export function setContext(name: string, context: Record<string, unknown> | null): void;
  export function addBreadcrumb(breadcrumb: {
    category?: string;
    message?: string;
    data?: Record<string, unknown>;
    level?: string;
  }): void;
  export function configureScope(callback: (scope: unknown) => void): void;
  export function withScope(callback: (scope: unknown) => void): void;
  export function startTransaction(context: { name: string; op?: string }): Transaction;
  export function wrap<T extends (...args: unknown[]) => unknown>(fn: T): T;
  export function showReportDialog(options: { eventId: string }): void;
  export function reactNativeTracingIntegration(): Integration;

  // React integration
  export function ErrorBoundary(props: {
    children: React.ReactNode;
    fallback?:
      | React.ReactNode
      | ((props: { error: Error; resetError: () => void }) => React.ReactNode);
    onError?: (error: Error, componentStack: string) => void;
  }): JSX.Element;

  export function withProfiler<P>(
    component: React.ComponentType<P>,
    options?: { name?: string }
  ): React.ComponentType<P>;
}
