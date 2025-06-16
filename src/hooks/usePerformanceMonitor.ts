
import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  renderTime: number;
  apiLatency: number;
  errorRate: number;
  userSatisfactionScore: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    apiLatency: 0,
    errorRate: 0,
    userSatisfactionScore: 95
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance thresholds
  const thresholds = {
    loadTime: 2000, // 2 seconds
    memoryUsage: 100, // 100MB
    renderTime: 16, // 16ms (60fps)
    apiLatency: 1000, // 1 second
    errorRate: 5, // 5%
    userSatisfactionScore: 80 // 80%
  };

  const measureLoadTime = useCallback(() => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
      
      if (loadTime > thresholds.loadTime) {
        addAlert('warning', 'Page load time is above optimal threshold', 'loadTime', loadTime, thresholds.loadTime);
      }
    }
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
      setMetrics(prev => ({ ...prev, memoryUsage: memoryUsageMB }));
      
      if (memoryUsageMB > thresholds.memoryUsage) {
        addAlert('warning', 'Memory usage is high', 'memoryUsage', memoryUsageMB, thresholds.memoryUsage);
      }
    }
  }, []);

  const measureRenderTime = useCallback(() => {
    let frameCount = 0;
    let totalTime = 0;
    const maxFrames = 60;

    const measureFrame = () => {
      const start = performance.now();
      
      requestAnimationFrame(() => {
        const end = performance.now();
        const frameTime = end - start;
        
        frameCount++;
        totalTime += frameTime;
        
        if (frameCount < maxFrames) {
          measureFrame();
        } else {
          const avgRenderTime = totalTime / frameCount;
          setMetrics(prev => ({ ...prev, renderTime: avgRenderTime }));
          
          if (avgRenderTime > thresholds.renderTime) {
            addAlert('warning', 'Render time is affecting smooth animations', 'renderTime', avgRenderTime, thresholds.renderTime);
          }
        }
      });
    };

    measureFrame();
  }, []);

  const measureApiLatency = useCallback(async () => {
    const start = performance.now();
    try {
      // Mock API call - replace with actual health check endpoint
      await fetch('/api/health', { method: 'HEAD' });
      const end = performance.now();
      const latency = end - start;
      
      setMetrics(prev => ({ ...prev, apiLatency: latency }));
      
      if (latency > thresholds.apiLatency) {
        addAlert('warning', 'API response time is slow', 'apiLatency', latency, thresholds.apiLatency);
      }
    } catch (error) {
      setMetrics(prev => ({ ...prev, errorRate: prev.errorRate + 1 }));
      addAlert('error', 'API request failed', 'errorRate', metrics.errorRate + 1, thresholds.errorRate);
    }
  }, [metrics.errorRate]);

  const addAlert = useCallback((
    type: PerformanceAlert['type'], 
    message: string, 
    metric: keyof PerformanceMetrics, 
    value: number, 
    threshold: number
  ) => {
    const alert: PerformanceAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      metric,
      value,
      threshold
    };
    
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep only last 10 alerts
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Initial measurements
    measureLoadTime();
    measureMemoryUsage();
    measureRenderTime();
    
    // Set up periodic monitoring
    const interval = setInterval(() => {
      measureMemoryUsage();
      measureApiLatency();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [measureLoadTime, measureMemoryUsage, measureRenderTime, measureApiLatency]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const getPerformanceScore = useCallback(() => {
    const scores = {
      loadTime: Math.max(0, 100 - (metrics.loadTime / thresholds.loadTime) * 50),
      memoryUsage: Math.max(0, 100 - (metrics.memoryUsage / thresholds.memoryUsage) * 50),
      renderTime: Math.max(0, 100 - (metrics.renderTime / thresholds.renderTime) * 50),
      apiLatency: Math.max(0, 100 - (metrics.apiLatency / thresholds.apiLatency) * 50),
      errorRate: Math.max(0, 100 - (metrics.errorRate / thresholds.errorRate) * 20)
    };
    
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    return Math.round(totalScore);
  }, [metrics, thresholds]);

  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (metrics.loadTime > thresholds.loadTime) {
      suggestions.push('Consider code splitting and lazy loading for better load times');
    }
    
    if (metrics.memoryUsage > thresholds.memoryUsage) {
      suggestions.push('Optimize memory usage by cleaning up event listeners and references');
    }
    
    if (metrics.renderTime > thresholds.renderTime) {
      suggestions.push('Use React.memo and useMemo for expensive computations');
    }
    
    if (metrics.apiLatency > thresholds.apiLatency) {
      suggestions.push('Implement API caching and request optimization');
    }
    
    if (metrics.errorRate > thresholds.errorRate) {
      suggestions.push('Add better error handling and retry mechanisms');
    }
    
    return suggestions;
  }, [metrics, thresholds]);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    alerts,
    isMonitoring,
    performanceScore: getPerformanceScore(),
    optimizationSuggestions: getOptimizationSuggestions(),
    clearAlerts,
    startMonitoring,
    stopMonitoring,
    thresholds
  };
};
