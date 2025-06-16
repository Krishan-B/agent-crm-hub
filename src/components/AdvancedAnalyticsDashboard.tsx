
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  Mail,
  Phone,
  FileCheck,
  RefreshCw,
  Download
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEdgeFunctions } from '../hooks/useEdgeFunctions';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { analytics, isLoading: analyticsLoading } = useAnalytics();
  const { executeFunction } = useEdgeFunctions();
  const { toast } = useToast();

  const generateAdvancedReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await executeFunction('analytics-report', { dateRange: timeRange });
      setReportData(result.analytics);
      toast({
        title: "Report Generated",
        description: "Advanced analytics report has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate analytics report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Simulate trend data for demonstration
  const trendData = [
    { name: 'Week 1', leads: 45, conversions: 8, revenue: 12500 },
    { name: 'Week 2', leads: 52, conversions: 12, revenue: 18200 },
    { name: 'Week 3', leads: 48, conversions: 10, revenue: 15800 },
    { name: 'Week 4', leads: 61, conversions: 15, revenue: 22100 },
  ];

  const conversionFunnelData = [
    { stage: 'Visitors', count: 1250, percentage: 100 },
    { stage: 'Leads', count: 234, percentage: 18.7 },
    { stage: 'Qualified', count: 156, percentage: 12.5 },
    { stage: 'Proposals', count: 89, percentage: 7.1 },
    { stage: 'Converted', count: 34, percentage: 2.7 },
  ];

  useEffect(() => {
    generateAdvancedReport();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={generateAdvancedReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData?.financial?.totalDeposits || 0)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">
                    {formatPercentage(calculateGrowthRate(68400, 52300))}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.leads?.conversionRate?.toFixed(1) || '0.0'}%
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+2.3%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData?.leads?.total || 0}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-sm text-red-600">-1.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData?.financial?.averageDeposit || 0)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+8.7%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(reportData?.leads?.byStatus || {}).map(([status, count]) => ({
                    name: status,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {Object.entries(reportData?.leads?.byStatus || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionFunnelData.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600" />
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {stage.count}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Emails Sent</span>
                </div>
                <Badge variant="secondary">
                  {reportData?.communications?.byType?.email || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Calls Made</span>
                </div>
                <Badge variant="secondary">
                  {reportData?.communications?.byType?.call || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Meetings Scheduled</span>
                </div>
                <Badge variant="secondary">
                  {reportData?.communications?.byType?.meeting || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileCheck className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">KYC Completed</span>
                </div>
                <Badge variant="secondary">
                  {reportData?.activities?.byType?.kyc_update || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">Top Performer</h3>
              <p className="text-sm text-green-600 mt-1">
                Email campaigns showing 34% higher engagement this month
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800">Lead Quality</h3>
              <p className="text-sm text-blue-600 mt-1">
                Average lead score improved by 12 points over last quarter
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-800">Conversion Rate</h3>
              <p className="text-sm text-purple-600 mt-1">
                Phone follow-ups convert 3x better than email-only campaigns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
