
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Loader2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEdgeFunctions } from '../hooks/useEdgeFunctions';

const AnalyticsReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState<any>(null);
  const { generateAnalyticsReport, isLoading } = useEdgeFunctions();
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleGenerateReport = async () => {
    try {
      const result = await generateAnalyticsReport(dateRange);
      setAnalytics(result.analytics);
      
      toast({
        title: "Analytics Report Generated",
        description: `Report generated for ${dateRange} period`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate analytics report",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const prepareChartData = (data: Record<string, any>) => {
    return Object.entries(data).map(([key, value]) => ({
      name: key.replace('_', ' ').toUpperCase(),
      value: typeof value === 'number' ? value : 0
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Report
          </CardTitle>
          <CardDescription>
            Generate comprehensive analytics reports for your leads and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.leads.total}
                  </div>
                  <div className="text-sm text-blue-600">Total Leads</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics.financial.totalDeposits)}
                  </div>
                  <div className="text-sm text-green-600">Total Deposits</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.leads.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-600">Conversion Rate</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.activities.engagement.toFixed(1)}
                  </div>
                  <div className="text-sm text-orange-600">Avg Activities/Lead</div>
                </div>
              </div>
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
                    data={prepareChartData(analytics.leads.byStatus)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareChartData(analytics.leads.byStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareChartData(analytics.leads.byCountry)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Types */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareChartData(analytics.activities.byType)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReport;
