/**
 * Debug Utilities
 *
 * Development-only debugging helpers
 */

import { Platform } from 'react-native';

/**
 * Console log with timestamp and component name
 */
export function debugLog(component: string, message: string, data?: any) {
  if (!__DEV__) return;

  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  const prefix = `[${timestamp}] [${component}]`;

  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

/**
 * Log render with component name
 */
export function debugRender(component: string) {
  if (!__DEV__) return;
  debugLog(component, '🔄 Rendered');
}

/**
 * Log user action
 */
export function debugAction(action: string, data?: any) {
  if (!__DEV__) return;
  debugLog('ACTION', `👆 ${action}`, data);
}

/**
 * Log navigation event
 */
export function debugNavigation(from: string, to: string, params?: any) {
  if (!__DEV__) return;
  debugLog('NAV', `📍 ${from} → ${to}`, params);
}

/**
 * Log API request
 */
export function debugApiRequest(method: string, url: string, data?: any) {
  if (!__DEV__) return;
  debugLog('API', `🌐 ${method} ${url}`, data);
}

/**
 * Log API response
 */
export function debugApiResponse(url: string, status: number, duration: number) {
  if (!__DEV__) return;
  const emoji = status < 400 ? '✅' : '❌';
  debugLog('API', `${emoji} ${url} - ${status} (${duration}ms)`);
}

/**
 * Log state change
 */
export function debugState(store: string, action: string, state?: any) {
  if (!__DEV__) return;
  debugLog(store, `📦 ${action}`, state);
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!__DEV__) return fn();

  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    debugLog('PERF', `⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    debugLog('PERF', `⏱️ ${label} failed: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Create a debug boundary for components
 */
export function createDebugBoundary(componentName: string) {
  return {
    onRender: () => debugRender(componentName),
    onMount: () => debugLog(componentName, '🟢 Mounted'),
    onUnmount: () => debugLog(componentName, '🔴 Unmounted'),
    onError: (error: Error) => debugLog(componentName, '❌ Error', error.message),
  };
}

/**
 * Development environment info
 */
export function getDevEnvironmentInfo() {
  if (!__DEV__) return null;

  return {
    platform: Platform.OS,
    version: Platform.Version,
    isHermes: typeof HermesInternal !== 'undefined',
    isDev: __DEV__,
  };
}

/**
 * Pretty print object to console
 */
export function prettyPrint(label: string, obj: any) {
  if (!__DEV__) return;
  console.log(`\n📋 ${label}:`);
  console.log(JSON.stringify(obj, null, 2));
}

// Type guard for Hermes
declare const HermesInternal: any;
