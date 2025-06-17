
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { Calendar, TrendingUp, Users, DollarSign, Target, Download, Filter } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch comprehensive analytics data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      const [
        leadsResponse,
        conversionsResponse,
        revenueResponse,
        activitiesResponse
      ] = await Promise.all([
        supabase.from('leads').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('leads').select('*').gt('balance', 0),
        supabase.from('transactions').select('*').eq('type', 'deposit'),
        supabase.from('lead_activities').select('*').gte('created_at', startDate.toISOString())
      ]);

      // Process data for charts
      const processedData = {
        leadTrends: processLeadTrends(leadsResponse.data || []),
        conversionFunnel: processConversionFunnel(leadsResponse.data || []),
        revenueAnalysis: processRevenueAnalysis(revenueResponse.data || []),
        sourceAnalysis: processSourceAnalysis(leadsResponse.data || []),
        performanceMetrics: processPerformanceMetrics(
          leadsResponse.data || [],
          conversionsResponse.data || [],
          revenueResponse.data || []
        )
      };

      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const processLeadTrends = (leads: any[]) => {
    const dailyData: { [key: string]: number } = {};
    
    leads.forEach(lead => {
      const date = new Date(lead.created_at).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return Object.entries(dailyData).map(([date, count]) => ({
      date,
      leads: count
    })).slice(-30);
  };

  const processConversionFunnel = (leads: any[]) => {
    const statuses = ['new', 'contacted', 'qualified', 'converted'];
    return statuses.map(status => ({
      stage: status,
      count: leads.filter(lead => lead.status === status).length
    }));
  };

  const processRevenueAnalysis = (transactions: any[]) => {
    const monthlyRevenue: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(transaction.amount);
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  const processSourceAnalysis = (leads: any[]) => {
    const sources: { [key: string]: number } = {};
    
    leads.forEach(lead => {
      const source = lead.source || 'Direct';
      sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources).map(([source, value]) => ({
      name: source,
      value
    }));
  };

  const processPerformanceMetrics = (leads: any[], conversions: any[], revenue: any[]) => {
    return {
      totalLeads: leads.length,
      conversionRate: leads.length > 0 ? (conversions.length / leads.length * 100).toFixed(1) : '0',
      totalRevenue: revenue.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      avgDealSize: conversions.length > 0 ? (revenue.reduce((sum, t) => sum + parseFloat(t.amount), 0) / conversions.length).toFixed(0) : '0'
    };
  };

  const exportData = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold">{analyticsData.performanceMetrics.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold">{analyticsData.performanceMetrics.conversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold">${analyticsData.performanceMetrics.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Deal Size</p>
                <p className="text-3xl font-bold">${analyticsData.performanceMetrics.avgDealSize}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Acquisition Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.leadTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.conversionFunnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#FF8042" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.sourceAnalysis}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.sourceAnalysis.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
