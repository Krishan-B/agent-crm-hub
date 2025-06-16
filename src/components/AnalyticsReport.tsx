
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';

const AnalyticsReport: React.FC = () => {
  const [reportType, setReportType] = useState('comprehensive');
  const [timeframe, setTimeframe] = useState('monthly');
  
  const {
    metrics,
    alerts,
    performanceScore,
    optimizationSuggestions,
    clearAlerts
  } = usePerformanceMonitor();

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    } else if (unit === 'MB') {
      return `${value.toFixed(1)}MB`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return value.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitor</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Performance Score
                  <Badge className={getScoreBadgeColor(performanceScore)}>
                    {performanceScore}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                    {performanceScore}
                  </div>
                  <p className="text-gray-500 mt-2">Overall Performance</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        performanceScore >= 90 ? 'bg-green-500' :
                        performanceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${performanceScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Load Time</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatMetric(metrics.loadTime, 'ms')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatMetric(metrics.memoryUsage, 'MB')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Render Time</span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {formatMetric(metrics.renderTime, 'ms')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">API Latency</span>
                    </div>
                    <span className="font-bold text-yellow-600">
                      {formatMetric(metrics.apiLatency, 'ms')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performance Alerts</CardTitle>
                  <Button variant="outline" size="sm" onClick={clearAlerts}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {alert.type === 'error' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-gray-500">
                            {alert.metric}: {formatMetric(alert.value, alert.metric.includes('Time') ? 'ms' : alert.metric === 'memoryUsage' ? 'MB' : '%')} 
                            (threshold: {formatMetric(alert.threshold, alert.metric.includes('Time') ? 'ms' : alert.metric === 'memoryUsage' ? 'MB' : '%')})
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Suggestions */}
          {optimizationSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Custom Reports</CardTitle>
                <div className="flex space-x-2">
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Lead Performance Report</h3>
                      <p className="text-sm text-gray-500">Detailed analysis of lead conversion metrics</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-medium">Revenue Analysis</h3>
                      <p className="text-sm text-gray-500">Financial performance and trends</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-medium">Agent Performance</h3>
                      <p className="text-sm text-gray-500">Individual and team performance metrics</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="font-medium">Communication Analytics</h3>
                      <p className="text-sm text-gray-500">Email, call, and message effectiveness</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-8 w-8 text-red-600" />
                    <div>
                      <h3 className="font-medium">Appointment Analytics</h3>
                      <p className="text-sm text-gray-500">Meeting scheduling and completion rates</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <div>
                      <h3 className="font-medium">Trend Analysis</h3>
                      <p className="text-sm text-gray-500">Historical trends and forecasting</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsReport;
