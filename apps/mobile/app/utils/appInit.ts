/**
 * App Initialization Utilities
 *
 * Handles app startup, resource loading, and error tracking
 */

import { Platform } from 'react-native';
// Font loading handled by Expo automatically

// Error tracking (development only)
const errorLog: {
  message: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, any>;
}[] = [];

/**
 * Log an error for tracking
 */
export function logError(error: Error | string, context?: Record<string, any>) {
  const errorEntry = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    timestamp: new Date(),
    context,
  };

  errorLog.push(errorEntry);

  if (__DEV__) {
    console.error('[Error Tracked]', errorEntry);
  }

  // Keep only last 100 errors
  if (errorLog.length > 100) {
    errorLog.shift();
  }
}

/**
 * Get all logged errors
 */
export function getErrorLog() {
  return [...errorLog];
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  errorLog.length = 0;
}

/**
 * App initialization result
 */
interface InitializationResult {
  success: boolean;
  duration: number;
  errors: string[];
}

/**
 * Initialize app resources
 */
export async function initializeApp(): Promise<InitializationResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Load fonts if needed
    await loadFonts().catch((e) => {
      errors.push(`Font loading failed: ${e.message}`);
    });

    // Preload critical assets
    await preloadAssets().catch((e) => {
      errors.push(`Asset preloading failed: ${e.message}`);
    });

    // Initialize services
    await initializeServices().catch((e) => {
      errors.push(`Service initialization failed: ${e.message}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(message);
    logError(error instanceof Error ? error : new Error(message));
  }

  return {
    success: errors.length === 0,
    duration: Date.now() - startTime,
    errors,
  };
}

/**
 * Load custom fonts
 */
async function loadFonts(): Promise<void> {
  // Add custom fonts here if needed
  // await Font.loadAsync({
  //   'CustomFont-Regular': require('@/assets/fonts/CustomFont-Regular.ttf'),
  // });
}

/**
 * Preload critical assets
 */
async function preloadAssets(): Promise<void> {
  // Add critical images to preload here
  // const images = [
  //   require('@/assets/images/logo.png'),
  // ];
  // await Promise.all(images.map(image => Asset.fromModule(image).downloadAsync()));
}

/**
 * Initialize app services
 */
async function initializeServices(): Promise<void> {
  // Initialize analytics, crash reporting, etc.
  if (__DEV__) {
    console.log('[Init] Services initialized');
  }
}

/**
 * Get device info for debugging
 */
export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isTV: Platform.isTV,
    constants: Platform.constants,
  };
}

/**
 * App startup timing helper
 */
export class StartupTimer {
  private marks: Map<string, number> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.marks.set('init', this.startTime);
  }

  mark(label: string) {
    this.marks.set(label, Date.now());
  }

  getDuration(label: string): number | null {
    const time = this.marks.get(label);
    return time ? time - this.startTime : null;
  }

  getTotalDuration(): number {
    return Date.now() - this.startTime;
  }

  getReport(): Record<string, number> {
    const report: Record<string, number> = {};
    this.marks.forEach((time, label) => {
      report[label] = time - this.startTime;
    });
    report['total'] = this.getTotalDuration();
    return report;
  }

  logReport() {
    if (!__DEV__) return;

    console.log('\n⏱️ Startup Timing Report');
    console.log('━'.repeat(40));

    const report = this.getReport();
    Object.entries(report).forEach(([label, time]) => {
      console.log(`${label}: ${time}ms`);
    });

    console.log('━'.repeat(40));
  }
}
