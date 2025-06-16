import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Download, UserPlus, Users, CheckCircle2, 
  MoreHorizontal, Zap
} from 'lucide-react';
import { useOptimizedLeads, BulkAction } from '../hooks/useOptimizedLeads';
import { VirtualizedLeadsTable } from '../components/VirtualizedLeadsTable';
import { useIntersectionObserver } from '../hooks/useLazyLoading';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [viewMode, setViewMode<'paginated' | 'infinite'>('paginated');

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Optimized Leads Management</h1>
            <p className="text-gray-600">High-performance lead management with virtualization and caching</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'infinite' ? 'default' : 'outline'}
              onClick={() => setViewMode('infinite')}
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              Infinite Scroll
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">
                {viewMode === 'infinite' ? `${lazyLeads.length} loaded` : `Page ${currentPage}`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View Mode</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">{viewMode}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              {/* Search and Quick Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search leads..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <Select 
                    value={filters.country} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.source} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.assignedAgent} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, assignedAgent: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assigned Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedLeads.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedLeads.length} lead(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Select value={bulkActionType} onValueChange={setBulkActionType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Bulk Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assign">Assign Agent</SelectItem>
                        <SelectItem value="status_change">Change Status</SelectItem>
                        <SelectItem value="export">Export Selected</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkAction} disabled={!bulkActionType}>
                      Apply
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedLeads([])}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Virtualized Table */}
            {viewMode === 'paginated' ? (
              <VirtualizedLeadsTable
                leads={currentLeads}
                selectedLeads={selectedLeads}
                onSelectLead={handleSelectLead}
                onSelectAll={handleSelectAll}
                containerHeight={600}
              />
            ) : (
              <>
                <VirtualizedLeadsTable
                  leads={currentLeads}
                  selectedLeads={selectedLeads}
                  onSelectLead={handleSelectLead}
                  onSelectAll={handleSelectAll}
                  containerHeight={600}
                />
                
                {/* Infinite scroll loading trigger */}
                <div ref={loadMoreRef} className="py-4">
                  {isLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  )}
                  {!hasMore && !isLoading && (
                    <p className="text-center text-gray-500">No more leads to load</p>
                  )}
                </div>
              </>
            )}

            {/* Regular Pagination */}
            {viewMode === 'paginated' && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} leads
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => fetchLeads(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline"
                    disabled={currentPage * pageSize >= totalCount}
                    onClick={() => fetchLeads(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OptimizedLeads;
