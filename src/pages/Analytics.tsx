
import React from 'react';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AnalyticsReport from '../components/AnalyticsReport';

const Analytics: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Advanced Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <AnalyticsReport />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;
