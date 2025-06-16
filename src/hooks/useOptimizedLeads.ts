
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';
import { leadsCache, searchCache } from '@/utils/cache';
import { useLazyLoading } from './useLazyLoading';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  status: 'active' | 'new' | 'contacted' | 'qualified' | 'converted' | 'inactive';
  source?: string;
  assigned_agent_id?: string;
  kyc_status: string;
  balance: number;
  bonus_amount: number;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
  assigned_agent?: {
    first_name: string;
    last_name: string;
  };
}

export interface LeadFilters {
  search: string;
  status: string;
  country: string;
  source: string;
  assignedAgent: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
}

export interface BulkAction {
  type: 'assign' | 'status_change' | 'export' | 'delete';
  data?: any;
}

export const useOptimizedLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const { user } = useAuth();

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'all',
    country: 'all',
    source: 'all',
    assignedAgent: 'all',
    dateRange: {}
  });

  // Memoized cache key for current filters and page
  const cacheKey = useMemo(() => {
    const filterString = JSON.stringify(filters);
    return `leads_${currentPage}_${pageSize}_${btoa(filterString)}`;
  }, [filters, currentPage, pageSize]);

  // Optimized fetch function with caching and query optimization
  const fetchLeadsOptimized = async (page = 1, limit = pageSize) => {
    if (!user) return { data: [], hasMore: false, count: 0 };
    
    // Check cache first
    const cached = leadsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;
    
    // Build optimized query with minimal data selection
    let query = supabase
      .from('leads')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        country,
        status,
        balance,
        bonus_amount,
        kyc_status,
        created_at,
        assigned_agent_id,
        assigned_agent:profiles!assigned_agent_id(
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_agent_id', user.id);
    }

    // Apply filters with optimized conditions
    if (filters.search) {
      // Use full-text search if available, otherwise fallback to LIKE
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.country !== 'all') {
      query = query.eq('country', filters.country);
    }

    if (filters.assignedAgent !== 'all') {
      if (filters.assignedAgent === 'unassigned') {
        query = query.is('assigned_agent_id', null);
      } else {
        query = query.eq('assigned_agent_id', filters.assignedAgent);
      }
    }

    if (filters.dateRange.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const typedLeads = (data || []).map(lead => ({
      ...lead,
      status: lead.status as Lead['status'],
    }));

    const hasMore = (count || 0) > offset + limit;
    const result = { data: typedLeads, hasMore, count: count || 0 };

    // Cache the result
    leadsCache.set(cacheKey, result);

    return result;
  };

  // Use lazy loading for infinite scroll
  const {
    items: lazyLeads,
    isLoading: isLazyLoading,
    hasMore,
    loadMore,
    reset: resetLazy,
    error: lazyError
  } = useLazyLoading(
    async (page, limit) => {
      const result = await fetchLeadsOptimized(page, limit);
      setTotalCount(result.count);
      return { data: result.data, hasMore: result.hasMore };
    },
    { pageSize, cacheKey: 'leads_lazy' }
  );

  // Regular paginated fetch for backward compatibility
  const fetchLeads = async (page = 1, limit = pageSize) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchLeadsOptimized(page, limit);
      setLeads(result.data);
      setTotalCount(result.count);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Optimized filter application with debouncing
  const filteredLeads = useMemo(() => {
    // For search, check cache first
    if (filters.search) {
      const searchKey = `search_${filters.search}`;
      const cached = searchCache.get(searchKey);
      if (cached) {
        return cached;
      }
    }

    let filtered = [...leads];

    // Client-side filtering for already loaded data
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(searchTerm) ||
        lead.last_name.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchTerm))
      );
      
      // Cache search results
      searchCache.set(`search_${filters.search}`, filtered);
    }

    return filtered;
  }, [leads, filters.search]);

  // Simplified bulk operations without RPC calls
  const performBulkAction = async (action: BulkAction) => {
    if (selectedLeads.length === 0) return;

    try {
      switch (action.type) {
        case 'assign':
          if (!action.data?.agentId) return;
          
          const { error: assignError } = await supabase
            .from('leads')
            .update({ assigned_agent_id: action.data.agentId })
            .in('id', selectedLeads);

          if (assignError) throw assignError;
          break;

        case 'status_change':
          if (!action.data?.status) return;
          
          const { error: statusError } = await supabase
            .from('leads')
            .update({ status: action.data.status })
            .in('id', selectedLeads);

          if (statusError) throw statusError;
          break;

        case 'export':
          const selectedLeadData = filteredLeads.filter(lead => 
            selectedLeads.includes(lead.id)
          );
          exportToCSV(selectedLeadData);
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .in('id', selectedLeads);

          if (deleteError) throw deleteError;
          break;
      }

      // Clear cache and refresh data
      leadsCache.clear();
      setSelectedLeads([]);
      fetchLeads(currentPage);
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError('Failed to perform bulk action');
    }
  };

  const exportToCSV = (leadsToExport: Lead[]) => {
    const headers = [
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Country', 
      'Status', 'Balance', 'KYC Status', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...leadsToExport.map(lead => [
        lead.id,
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.phone || '',
        lead.country,
        lead.status,
        lead.balance,
        lead.kyc_status,
        lead.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Set up real-time subscriptions with cache invalidation
  useRealTimeData({
    onLeadsChange: () => {
      leadsCache.clear();
      searchCache.clear();
      fetchLeads(currentPage);
    }
  });

  useEffect(() => {
    fetchLeads();
  }, [user]);

  // Reset cache when filters change
  useEffect(() => {
    leadsCache.invalidateByPattern('leads_.*');
    resetLazy();
    fetchLeads(1);
  }, [filters]);

  return {
    // Regular pagination mode
    leads: filteredLeads,
    selectedLeads,
    isLoading: isLoading || isLazyLoading,
    error: error || lazyError,
    totalCount,
    currentPage,
    pageSize,
    filters,
    setFilters,
    setSelectedLeads,
    fetchLeads,
    performBulkAction,
    exportToCSV: () => exportToCSV(filteredLeads),
    
    // Lazy loading mode
    lazyLeads,
    hasMore,
    loadMore,
    resetLazy,
  };
};
