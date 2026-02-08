/**
 * Monitoring Services Index
 *
 * Exports all monitoring and analytics integrations
 */

export { default as Sentry, initializeSentry, useSentryCapture } from './sentry';
export { default as Analytics, initializeAnalytics } from './firebaseAnalytics';

/**
 * Initialize all monitoring services
 * Call this in App.tsx on startup
 */
export async function initializeMonitoring(): Promise<void> {
  // Import dynamically to avoid crashes if packages not installed
  try {
    const { initializeSentry } = await import('./sentry');
    initializeSentry();
  } catch (error) {
    console.warn('[Monitoring] Sentry not available:', error);
  }

  try {
    const { initializeAnalytics } = await import('./firebaseAnalytics');
    await initializeAnalytics();
  } catch (error) {
    console.warn('[Monitoring] Firebase Analytics not available:', error);
  }
}
