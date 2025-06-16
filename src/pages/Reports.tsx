
import React from 'react';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Settings, BarChart3 } from 'lucide-react';
import ReportBuilder from '../components/reports/ReportBuilder';
import ScheduledReports from '../components/reports/ScheduledReports';
import AnalyticsReport from '../components/AnalyticsReport';

const Reports: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        </div>
        
        <Tabs defaultValue="builder" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Builder
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ReportBuilder />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">Generate Lead Summary</h4>
                      <p className="text-sm text-gray-500">Current month lead overview</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">Export All Data</h4>
                      <p className="text-sm text-gray-500">Complete database export</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">Performance Report</h4>
                      <p className="text-sm text-gray-500">Agent performance metrics</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4">
            <ScheduledReports />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsReport />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Default Export Format</h4>
                    <p className="text-sm text-gray-500 mb-2">Choose the default format for report exports</p>
                    {/* Add settings controls here */}
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Email Templates</h4>
                    <p className="text-sm text-gray-500 mb-2">Customize email templates for scheduled reports</p>
                    {/* Add email template settings here */}
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Data Retention</h4>
                    <p className="text-sm text-gray-500 mb-2">Configure how long report data is stored</p>
                    {/* Add data retention settings here */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
