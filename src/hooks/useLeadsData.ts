
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Lead, LeadFilters } from './useOptimizedLeads';

export const useLeadsData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLeadsOptimized = async (
    filters: LeadFilters,
    page = 1,
    limit = 20,
    cacheKey: string,
    getCachedData: (key: string) => any,
    setCachedData: (key: string, data: any) => void
  ) => {
    if (!user) return { data: [], hasMore: false, count: 0 };
    
    // Check cache first
    const cached = getCachedData(cacheKey);
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
    setCachedData(cacheKey, result);

    return result;
  };

  return {
    fetchLeadsOptimized,
    isLoading,
    setIsLoading,
    error,
    setError,
  };
};
