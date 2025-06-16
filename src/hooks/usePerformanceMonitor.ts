
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
    
    // Calculate page load time
    const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    
    // Get memory usage (if available)
    const memory = (performance as any).memory;
    const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;

    // Calculate render time (approximate)
    const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

    // Simulate network latency measurement
    const networkLatency = navigation.responseEnd - navigation.requestStart;

    return {
      pageLoadTime,
      renderTime,
      memoryUsage,
      networkLatency,
      errorCount: 0, // Will be updated by error tracking
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

    if (metric.renderTime > thresholds.renderTime) {
      newAlerts.push({
        id: `alert-${Date.now()}-2`,
        type: 'warning',
        message: 'Render time is slower than expected',
        metric: 'renderTime',
        value: metric.renderTime,
        threshold: thresholds.renderTime,
        timestamp: new Date()
      });
    }

    if (metric.memoryUsage > thresholds.memoryUsage) {
      newAlerts.push({
        id: `alert-${Date.now()}-3`,
        type: 'error',
        message: 'Memory usage is higher than expected',
        metric: 'memoryUsage',
        value: metric.memoryUsage,
        threshold: thresholds.memoryUsage,
        timestamp: new Date()
      });
    }

    if (metric.networkLatency > thresholds.networkLatency) {
      newAlerts.push({
        id: `alert-${Date.now()}-4`,
        type: 'warning',
        message: 'Network latency is higher than expected',
        metric: 'networkLatency',
        value: metric.networkLatency,
        threshold: thresholds.networkLatency,
        timestamp: new Date()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Collect initial metrics
    const initialMetrics = collectMetrics();
    setMetrics([initialMetrics]);
    checkThresholds(initialMetrics);

    // Set up periodic monitoring
    const interval = setInterval(() => {
      const newMetrics = collectMetrics();
      setMetrics(prev => [...prev.slice(-19), newMetrics]); // Keep last 20 metrics
      checkThresholds(newMetrics);
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    // Start monitoring when component mounts
    const cleanup = startMonitoring();
    
    // Track JavaScript errors
    const errorHandler = (event: ErrorEvent) => {
      setMetrics(prev => {
        const latest = prev[prev.length - 1];
        if (latest) {
          return [...prev.slice(0, -1), { ...latest, errorCount: latest.errorCount + 1 }];
        }
        return prev;
      });

      setAlerts(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'error',
        message: `JavaScript Error: ${event.message}`,
        metric: 'errorCount',
        value: 1,
        threshold: 0,
        timestamp: new Date()
      }]);
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
    clearAlerts,
    dismissAlert,
    startMonitoring
  };
};
