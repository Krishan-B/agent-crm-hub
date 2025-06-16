
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Activity, Loader2 } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsDashboard: React.FC = () => {
  const { snapshots, isLoading, generateSnapshot } = useAnalytics();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const latestSnapshot = snapshots[0];

  const prepareChartData = () => {
    return snapshots.slice(0, 30).reverse().map(snapshot => ({
      date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leads: snapshot.total_leads,
      deposits: snapshot.total_deposits,
      conversion: snapshot.conversion_rate
    }));
  };

  const prepareKycData = () => {
    if (!latestSnapshot) return [];
    
    return [
      { name: 'Approved', value: latestSnapshot.kyc_approved, color: '#00C49F' },
      { name: 'Pending', value: latestSnapshot.kyc_pending, color: '#FFBB28' },
      { name: 'Rejected', value: latestSnapshot.kyc_rejected, color: '#FF8042' }
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!latestSnapshot) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No analytics data available.</p>
        <Button onClick={() => generateSnapshot()}>
          Generate Analytics Snapshot
        </Button>
      </div>
    );
  }

  const chartData = prepareChartData();
  const kycData = prepareKycData();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.total_leads}</div>
            <p className="text-xs text-muted-foreground">
              +{latestSnapshot.new_leads_today} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latestSnapshot.total_deposits)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(latestSnapshot.average_deposit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {latestSnapshot.converted_leads} converted leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSnapshot.activities_count}</div>
            <p className="text-xs text-muted-foreground">
              {latestSnapshot.communications_sent} communications sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Growth Trend</CardTitle>
            <CardDescription>Total leads over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KYC Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Status Distribution</CardTitle>
            <CardDescription>Current KYC verification status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kycData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {kycData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deposit Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit Trends</CardTitle>
            <CardDescription>Total deposits over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="deposits" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trend</CardTitle>
            <CardDescription>Conversion percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Line type="monotone" dataKey="conversion" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Actions</CardTitle>
          <CardDescription>Generate reports and refresh data</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => generateSnapshot()}>
            <Calendar className="h-4 w-4 mr-2" />
            Generate Today's Snapshot
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
