
import React from 'react';
import Layout from '../components/Layout';
import AnalyticsReport from '../components/AnalyticsReport';
import BatchOperations from '../components/BatchOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Analytics: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Operations</h1>
          <p className="text-gray-600">Advanced analytics and batch operations powered by AI</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics Reports</TabsTrigger>
            <TabsTrigger value="batch">Batch Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsReport />
          </TabsContent>

          <TabsContent value="batch">
            <BatchOperations />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;
