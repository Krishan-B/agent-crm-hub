
import React from 'react';
import Layout from '../components/Layout';
import ProductionReadinessChecker from '../components/ProductionReadinessChecker';
import PerformanceOptimizer from '../components/PerformanceOptimizer';
import DocumentationGenerator from '../components/DocumentationGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProductionReadiness: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Readiness</h1>
          <p className="text-gray-600">Final testing, optimization, and deployment preparation</p>
        </div>

        <Tabs defaultValue="readiness" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="readiness">Readiness Check</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="readiness" className="space-y-6">
            <ProductionReadinessChecker />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceOptimizer />
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <DocumentationGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProductionReadiness;
