
import { useState, useEffect } from 'react';

export interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorCount: number;
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance thresholds
  const thresholds = {
    pageLoadTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
    memoryUsage: 100, // 100MB
    networkLatency: 1000, // 1 second
  };

  const collectMetrics = (): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    const memory = (performance as any).memory;
    const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
    const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    const networkLatency = navigation.responseEnd - navigation.requestStart;

    return {
      pageLoadTime,
      renderTime,
      memoryUsage,
      networkLatency,
      errorCount: 0,
      timestamp: new Date()
    };
  };

  const checkThresholds = (metric: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    if (metric.pageLoadTime > thresholds.pageLoadTime) {
      newAlerts.push({
        id: `alert-${Date.now()}-1`,
        type: 'warning',
        message: 'Page load time is slower than expected',
        metric: 'pageLoadTime',
        value: metric.pageLoadTime,
        threshold: thresholds.pageLoadTime,
        timestamp: new Date()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  };

  const calculatePerformanceScore = (latestMetrics: PerformanceMetrics): number => {
    let score = 100;
    
    if (latestMetrics.pageLoadTime > thresholds.pageLoadTime) score -= 20;
    if (latestMetrics.renderTime > thresholds.renderTime) score -= 15;
    if (latestMetrics.memoryUsage > thresholds.memoryUsage) score -= 25;
    if (latestMetrics.networkLatency > thresholds.networkLatency) score -= 20;
    if (latestMetrics.errorCount > 0) score -= (latestMetrics.errorCount * 10);

    return Math.max(0, score);
  };

  const generateOptimizationSuggestions = (latestMetrics: PerformanceMetrics): string[] => {
    const suggestions: string[] = [];

    if (latestMetrics.pageLoadTime > thresholds.pageLoadTime) {
      suggestions.push('Consider optimizing your bundle size and implementing code splitting');
    }
    if (latestMetrics.renderTime > thresholds.renderTime) {
      suggestions.push('Use React.memo and useMemo to optimize component re-renders');
    }
    if (latestMetrics.memoryUsage > thresholds.memoryUsage) {
      suggestions.push('Check for memory leaks and optimize large data structures');
    }

    return suggestions;
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    const initialMetrics = collectMetrics();
    setMetrics([initialMetrics]);
    checkThresholds(initialMetrics);

    const interval = setInterval(() => {
      const newMetrics = collectMetrics();
      setMetrics(prev => [...prev.slice(-19), newMetrics]);
      checkThresholds(newMetrics);
    }, 30000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  };

  const clearAlerts = () => setAlerts([]);
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const latestMetrics = metrics[metrics.length - 1] || {
    pageLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorCount: 0,
    timestamp: new Date()
  };

  const performanceScore = calculatePerformanceScore(latestMetrics);
  const optimizationSuggestions = generateOptimizationSuggestions(latestMetrics);

  useEffect(() => {
    const cleanup = startMonitoring();
    
    const errorHandler = (event: ErrorEvent) => {
      setMetrics(prev => {
        const latest = prev[prev.length - 1];
        if (latest) {
          return [...prev.slice(0, -1), { ...latest, errorCount: latest.errorCount + 1 }];
        }
        return prev;
      });
    };

    window.addEventListener('error', errorHandler);
    return () => {
      cleanup();
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring,
    performanceScore,
    optimizationSuggestions,
    clearAlerts,
    dismissAlert,
    startMonitoring
  };
};
