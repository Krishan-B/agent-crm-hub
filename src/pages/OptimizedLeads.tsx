
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useOptimizedLeads, BulkAction } from '../hooks/useOptimizedLeads';
import { VirtualizedLeadsTable } from '../components/VirtualizedLeadsTable';
import { useIntersectionObserver } from '../hooks/useLazyLoading';
import { OptimizedLeadsHeader } from '../components/optimized-leads/OptimizedLeadsHeader';
import { PerformanceStats } from '../components/optimized-leads/PerformanceStats';
import { LeadsFilters } from '../components/optimized-leads/LeadsFilters';
import { BulkActions } from '../components/optimized-leads/BulkActions';
import { LeadsPagination } from '../components/optimized-leads/LeadsPagination';
import { InfiniteScrollLoader } from '../components/optimized-leads/InfiniteScrollLoader';

const OptimizedLeads: React.FC = () => {
  const {
    leads,
    lazyLeads,
    selectedLeads,
    isLoading,
    error,
    totalCount,
    currentPage,
    pageSize,
    filters,
    setFilters,
    setSelectedLeads,
    fetchLeads,
    performBulkAction,
    exportToCSV,
    hasMore,
    loadMore,
  } = useOptimizedLeads();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'paginated' | 'infinite'>('paginated');

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(
    () => {
      if (viewMode === 'infinite' && hasMore && !isLoading) {
        loadMore();
      }
    },
    { threshold: 0.1 }
  );

  const handleSelectAll = (checked: boolean) => {
    const currentLeads = viewMode === 'infinite' ? lazyLeads : leads;
    if (checked) {
      setSelectedLeads(currentLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedLeads.length === 0) return;

    const action: BulkAction = {
      type: bulkActionType as BulkAction['type']
    };

    if (bulkActionType === 'assign') {
      action.data = { agentId: 'agent-id' };
    } else if (bulkActionType === 'status_change') {
      action.data = { status: 'contacted' };
    }

    await performBulkAction(action);
    setBulkActionType('');
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading leads</p>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentLeads = viewMode === 'infinite' ? lazyLeads : leads;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <OptimizedLeadsHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={exportToCSV}
        />

        {/* Performance Stats */}
        <PerformanceStats
          totalCount={totalCount}
          selectedCount={selectedLeads.length}
          visibleCount={currentLeads.length}
          lazyLoadedCount={lazyLeads.length}
          viewMode={viewMode}
          currentPage={currentPage}
        />

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <LeadsFilters
                filters={filters}
                setFilters={setFilters}
                showAdvancedFilters={showAdvancedFilters}
                setShowAdvancedFilters={setShowAdvancedFilters}
              />

              <BulkActions
                selectedCount={selectedLeads.length}
                bulkActionType={bulkActionType}
                setBulkActionType={setBulkActionType}
                onApplyBulkAction={handleBulkAction}
                onClearSelection={() => setSelectedLeads([])}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Virtualized Table */}
            <VirtualizedLeadsTable
              leads={currentLeads}
              selectedLeads={selectedLeads}
              onSelectLead={handleSelectLead}
              onSelectAll={handleSelectAll}
              containerHeight={600}
            />

            {/* Infinite scroll loading trigger */}
            {viewMode === 'infinite' && (
              <InfiniteScrollLoader
                loadMoreRef={loadMoreRef}
                isLoading={isLoading}
                hasMore={hasMore}
              />
            )}

            {/* Regular Pagination */}
            {viewMode === 'paginated' && (
              <LeadsPagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={fetchLeads}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OptimizedLeads;
