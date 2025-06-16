
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkImportExport } from '../components/data-management/BulkImportExport';
import { DataArchiving } from '../components/data-management/DataArchiving';
import { Upload, Archive, Shield, Database } from 'lucide-react';

const DataManagement: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
          <p className="text-gray-600">Manage your data with bulk operations, archiving, and validation</p>
        </div>

        <Tabs defaultValue="import-export" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="import-export" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import/Export
            </TabsTrigger>
            <TabsTrigger value="archiving" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archiving
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="import-export">
            <BulkImportExport />
          </TabsContent>
          
          <TabsContent value="archiving">
            <DataArchiving />
          </TabsContent>
          
          <TabsContent value="validation">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Data Validation Rules</h3>
              <p className="text-gray-500">Configure custom validation rules for your data.</p>
              <p className="text-sm text-gray-400 mt-2">Coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="database">
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Database Tools</h3>
              <p className="text-gray-500">Advanced database management and optimization tools.</p>
              <p className="text-sm text-gray-400 mt-2">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DataManagement;
