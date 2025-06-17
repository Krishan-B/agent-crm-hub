
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';
import { useLazyLoading } from './useLazyLoading';
import { useLeadsFilters, LeadFilters } from './useLeadsFilters';
import { useLeadsBulkActions, BulkAction } from './useLeadsBulkActions';
import { useLeadsCache } from './useLeadsCache';
import { useLeadsData } from './useLeadsData';
import { searchCache } from '@/utils/cache';

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

export type { LeadFilters, BulkAction };

export const useOptimizedLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const { user } = useAuth();

  // Use the individual hooks
  const { filters, setFilters } = useLeadsFilters();
  const { cacheKey, getCachedData, setCachedData, clearCache, invalidateCache } = useLeadsCache(filters, currentPage, pageSize);
  const { fetchLeadsOptimized, isLoading, setIsLoading, error, setError } = useLeadsData();
  const { performBulkAction, exportToCSV, bulkActionError } = useLeadsBulkActions(
    selectedLeads,
    setSelectedLeads,
    () => {
      clearCache();
      fetchLeads(currentPage);
    }
  );

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
      const result = await fetchLeadsOptimized(filters, page, limit, `leads_lazy_${page}`, getCachedData, setCachedData);
      setTotalCount(result.count);
      return { data: result.data, hasMore: result.hasMore };
    },
    { pageSize, cacheKey: 'leads_lazy' }
  );

  // Regular paginated fetch
  const fetchLeads = async (page = 1, limit = pageSize) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchLeadsOptimized(filters, page, limit, cacheKey, getCachedData, setCachedData);
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
      const cached = searchCache.get<Lead[]>(searchKey);
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

  // Set up real-time subscriptions with cache invalidation
  useRealTimeData({
    onLeadsChange: () => {
      clearCache();
      fetchLeads(currentPage);
    }
  });

  useEffect(() => {
    fetchLeads();
  }, [user]);

  // Reset cache when filters change
  useEffect(() => {
    invalidateCache();
    resetLazy();
    fetchLeads(1);
  }, [filters]);

  return {
    // Regular pagination mode
    leads: filteredLeads,
    selectedLeads,
    isLoading: isLoading || isLazyLoading,
    error: error || lazyError || bulkActionError,
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
