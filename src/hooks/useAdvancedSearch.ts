
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Lead } from './useLeads';

export interface SearchFilters {
  query?: string;
  status?: string[];
  kycStatus?: string[];
  countries?: string[];
  assignedAgents?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  balanceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  hasActivity?: boolean;
  lastContactDays?: number;
}

export const useAdvancedSearch = () => {
  const [results, setResults] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const search = async (filters: SearchFilters) => {
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
        `);

      // Full-text search
      if (filters.query) {
        query = query.textSearch('search_vector', filters.query);
      }

      // Status filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // KYC status filters
      if (filters.kycStatus && filters.kycStatus.length > 0) {
        query = query.in('kyc_status', filters.kycStatus);
      }

      // Country filters
      if (filters.countries && filters.countries.length > 0) {
        query = query.in('country', filters.countries);
      }

      // Assigned agent filters
      if (filters.assignedAgents && filters.assignedAgents.length > 0) {
        query = query.in('assigned_agent_id', filters.assignedAgents);
      }

      // Date range filter
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      // Balance range filter
      if (filters.balanceRange) {
        query = query
          .gte('balance', filters.balanceRange.min)
          .lte('balance', filters.balanceRange.max);
      }

      // Last contact filter
      if (filters.lastContactDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastContactDays);
        query = query.lte('last_contact', cutoffDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error performing search:', error);
        setError(error.message);
        return;
      }

      let filteredResults = data || [];

      // Tag filtering (needs separate query due to junction table)
      if (filters.tags && filters.tags.length > 0) {
        const { data: taggedLeads, error: tagError } = await supabase
          .from('lead_tag_assignments')
          .select('lead_id')
          .in('tag_id', filters.tags);

        if (tagError) {
          console.error('Error filtering by tags:', tagError);
        } else {
          const taggedLeadIds = taggedLeads?.map(t => t.lead_id) || [];
          filteredResults = filteredResults.filter(lead => taggedLeadIds.includes(lead.id));
        }
      }

      // Activity filtering
      if (filters.hasActivity) {
        const { data: activeLeads, error: activityError } = await supabase
          .from('lead_activities')
          .select('lead_id')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (activityError) {
          console.error('Error filtering by activity:', activityError);
        } else {
          const activeLeadIds = activeLeads?.map(a => a.lead_id) || [];
          filteredResults = filteredResults.filter(lead => activeLeadIds.includes(lead.id));
        }
      }

      setResults(filteredResults);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Failed to perform search');
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, error, search };
};
