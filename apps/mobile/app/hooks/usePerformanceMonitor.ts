/**
 * Performance Monitoring Hook
 *
 * Tracks app performance metrics in development
 */

import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager } from 'react-native';

interface PerformanceMetrics {
  componentName: string;
  mountTime: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

const metricsStore = new Map<string, PerformanceMetrics>();
let instanceCounter = 0;

/**
 * Hook to monitor component performance
 * Only active in development mode
 */
export function usePerformanceMonitor(componentName: string) {
  const instanceIdRef = useRef<number | null>(null);
  if (instanceIdRef.current === null) {
    instanceCounter += 1;
    instanceIdRef.current = instanceCounter;
  }
  const instanceId = instanceIdRef.current;
  const metricsKey = `${componentName}#${instanceId}`;

  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderStart = useRef(Date.now());

  useEffect(() => {
    if (!__DEV__) return;

    const now = Date.now();
    const renderTime = now - lastRenderStart.current;
    renderCount.current += 1;
    renderTimes.current.push(renderTime);

    const totalRenderTime = renderTimes.current.reduce((a, b) => a + b, 0);
    const averageRenderTime = totalRenderTime / renderTimes.current.length;

    const metrics: PerformanceMetrics = {
      componentName,
      mountTime: mountTime.current,
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime,
      totalRenderTime,
    };

    metricsStore.set(metricsKey, metrics);
    lastRenderStart.current = Date.now();
  });

  useEffect(() => {
    if (!__DEV__) return;

    return () => {
      // Log final metrics on unmount
      const metrics = metricsStore.get(metricsKey);
      if (metrics) {
        console.log(`[Performance] ${componentName} unmounted:`, {
          totalRenders: metrics.renderCount,
          avgRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
          totalTime: `${metrics.totalRenderTime.toFixed(2)}ms`,
          lifetime: `${(Date.now() - metrics.mountTime) / 1000}s`,
        });
        metricsStore.delete(metricsKey);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    getMetrics: () => metricsStore.get(metricsKey),
  };
}

/**
 * Hook to measure interaction time
 */
export function useInteractionTimer() {
  const startTime = useRef<number | null>(null);

  const startInteraction = useCallback((label: string) => {
    if (!__DEV__) return;
    startTime.current = Date.now();
    console.log(`[Interaction] ${label} started`);
  }, []);

  const endInteraction = useCallback((label: string) => {
    if (!__DEV__ || !startTime.current) return;
    const duration = Date.now() - startTime.current;
    console.log(`[Interaction] ${label} completed in ${duration}ms`);
    startTime.current = null;
    return duration;
  }, []);

  return { startInteraction, endInteraction };
}

/**
 * Hook to defer expensive operations until after interactions
 */
export function useDeferredOperation() {
  const pendingOperations = useRef<(() => void)[]>([]);

  const defer = useCallback((operation: () => void) => {
    pendingOperations.current.push(operation);

    InteractionManager.runAfterInteractions(() => {
      const ops = pendingOperations.current;
      pendingOperations.current = [];
      ops.forEach((op) => op());
    });
  }, []);

  return { defer };
}

/**
 * Get all collected performance metrics
 */
export function getAllPerformanceMetrics(): PerformanceMetrics[] {
  return Array.from(metricsStore.values());
}

/**
 * Log all performance metrics to console
 */
export function logPerformanceReport() {
  if (!__DEV__) return;

  const metrics = getAllPerformanceMetrics();

  console.log('\n📊 Performance Report');
  console.log('━'.repeat(50));

  metrics
    .sort((a, b) => b.totalRenderTime - a.totalRenderTime)
    .forEach((m) => {
      console.log(`${m.componentName}:`);
      console.log(`  Renders: ${m.renderCount}`);
      console.log(`  Avg Time: ${m.averageRenderTime.toFixed(2)}ms`);
      console.log(`  Total Time: ${m.totalRenderTime.toFixed(2)}ms`);
    });

  console.log('━'.repeat(50));
}
