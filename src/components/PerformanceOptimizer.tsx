
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const PerformanceOptimizer: React.FC = () => {
  const {
    metrics,
    performanceScore,
    optimizationSuggestions,
    alerts,
    clearAlerts,
    dismissAlert
  } = usePerformanceMonitor();

  const [optimizations, setOptimizations] = useState<{
    id: string;
    name: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    implemented: boolean;
  }[]>([
    {
      id: 'lazy-loading',
      name: 'Lazy Loading Components',
      description: 'Load components only when needed',
      impact: 'high',
      implemented: true
    },
    {
      id: 'code-splitting',
      name: 'Code Splitting',
      description: 'Split bundles for better loading',
      impact: 'high',
      implemented: true
    },
    {
      id: 'memoization',
      name: 'React Memoization',
      description: 'Optimize re-renders with memo and useMemo',
      impact: 'medium',
      implemented: true
    },
    {
      id: 'virtualization',
      name: 'List Virtualization',
      description: 'Virtual scrolling for large lists',
      impact: 'high',
      implemented: true
    },
    {
      id: 'caching',
      name: 'Data Caching',
      description: 'Cache API responses and computed data',
      impact: 'medium',
      implemented: true
    }
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    return <Badge variant={colors[impact as keyof typeof colors]}>{impact}</Badge>;
  };

  const latestMetrics = metrics[metrics.length - 1];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Real-time performance monitoring and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </div>
              <p className="text-sm text-gray-600">Performance Score</p>
            </div>
            {latestMetrics && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {Math.round(latestMetrics.pageLoadTime)}ms
                  </div>
                  <p className="text-sm text-gray-600">Page Load Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {Math.round(latestMetrics.memoryUsage)}MB
                  </div>
                  <p className="text-sm text-gray-600">Memory Usage</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">
                    {alerts.length}
                  </div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="optimizations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="optimizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applied Optimizations</CardTitle>
              <CardDescription>
                Performance optimizations currently implemented
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizations.map(opt => (
                  <div key={opt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {opt.implemented ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">{opt.name}</p>
                        <p className="text-sm text-gray-600">{opt.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getImpactBadge(opt.impact)}
                      <Badge variant={opt.implemented ? 'default' : 'outline'}>
                        {opt.implemented ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>
                AI-generated suggestions based on current performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p>{suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No suggestions available. Performance looks good!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Performance Alerts
                {alerts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAlerts}>
                    Clear All
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Real-time performance issue notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-gray-600">
                            {alert.metric}: {Math.round(alert.value)} (threshold: {alert.threshold})
                          </p>
                          <p className="text-xs text-gray-500">{alert.timestamp.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => dismissAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No active alerts. Performance is within normal ranges.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOptimizer;
