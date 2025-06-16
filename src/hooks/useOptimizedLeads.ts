
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  status: 'new' | 'contacted' | 'qualified' | 'active' | 'converted' | 'inactive';
  kyc_status: 'pending' | 'approved' | 'rejected';
  balance: number;
  assigned_agent_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  assigned_agent?: {
    first_name: string;
    last_name: string;
  };
}

export interface SearchFilters {
  search?: string;
  status?: string;
  kycStatus?: string;
  country?: string;
  assignedAgent?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  balanceRange?: {
    min: number;
    max: number;
  };
}

export const useOptimizedLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const { user } = useAuth();
  const pageSize = 25;

  // Debounced search function
  const debouncedSearch = useCallback((filters: SearchFilters) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      setSearchFilters(filters);
      setCurrentPage(1);
    }, 300);
    
    setDebounceTimer(timer);
  }, [debounceTimer]);

  // Fetch leads with optimized query
  const fetchLeads = useCallback(async (page = 1, filters: SearchFilters = {}) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          assigned_agent:profiles!assigned_agent_id(
            first_name,
            last_name
          )
        `, { count: 'exact' });

      // Apply filters based on user role
      if (user.role !== 'admin') {
        query = query.eq('assigned_agent_id', user.id);
      }

      // Apply search filters
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,` +
          `last_name.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%,` +
          `phone.ilike.%${filters.search}%`
        );
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.kycStatus) {
        query = query.eq('kyc_status', filters.kycStatus);
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.assignedAgent) {
        query = query.eq('assigned_agent_id', filters.assignedAgent);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      if (filters.balanceRange) {
        query = query
          .gte('balance', filters.balanceRange.min)
          .lte('balance', filters.balanceRange.max);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Error fetching leads:', fetchError);
        setError(fetchError.message);
        return;
      }

      setLeads(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error in fetchLeads:', err);
      setError('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [user, pageSize]);

  // Memoized filtered results for better performance
  const filteredResults = useMemo(() => {
    return {
      leads,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage,
      pageSize,
      totalCount
    };
  }, [leads, totalCount, currentPage, pageSize]);

  // Set up real-time subscriptions
  useRealTimeData({
    onLeadsChange: () => fetchLeads(currentPage, searchFilters)
  });

  // Search and filter functions
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...searchFilters, ...newFilters };
    debouncedSearch(updatedFilters);
  }, [searchFilters, debouncedSearch]);

  const clearFilters = useCallback(() => {
    setSearchFilters({});
    setCurrentPage(1);
  }, []);

  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Export leads functionality
  const exportLeads = useCallback(async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_agent_id', user?.role === 'admin' ? undefined : user?.id);

      if (error) throw error;

      // Create CSV content
      if (format === 'csv') {
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Status', 'KYC Status', 'Balance', 'Created At'];
        const csvContent = [
          headers.join(','),
          ...data.map(lead => [
            lead.first_name,
            lead.last_name,
            lead.email,
            lead.phone || '',
            lead.country,
            lead.status,
            lead.kyc_status,
            lead.balance,
            new Date(lead.created_at).toLocaleDateString()
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting leads:', error);
      throw error;
    }
  }, [user]);

  // Initial load and filter changes
  useEffect(() => {
    fetchLeads(currentPage, searchFilters);
  }, [fetchLeads, currentPage, searchFilters]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    ...filteredResults,
    isLoading,
    error,
    searchFilters,
    updateFilters,
    clearFilters,
    changePage,
    exportLeads,
    refetch: () => fetchLeads(currentPage, searchFilters)
  };
};
