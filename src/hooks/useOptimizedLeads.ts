
import { useState, useEffect } from 'react';
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
  status: 'active' | 'new' | 'contacted' | 'qualified' | 'converted' | 'inactive';
  source: string;
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
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
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

  const fetchLeads = async (page = 1, limit = pageSize) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('leads')
        .select(`
          *,
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

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        setError(error.message);
        return;
      }

      // Type assertion to ensure proper typing and add missing source field
      const typedLeads = (data || []).map(lead => ({
        ...lead,
        status: lead.status as Lead['status'],
        source: lead.source || 'unknown' // Provide default value for source
      }));

      setLeads(typedLeads);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(searchTerm) ||
        lead.last_name.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Country filter
    if (filters.country !== 'all') {
      filtered = filtered.filter(lead => lead.country === filters.country);
    }

    // Source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(lead => lead.source === filters.source);
    }

    // Assigned agent filter
    if (filters.assignedAgent !== 'all') {
      filtered = filtered.filter(lead => lead.assigned_agent_id === filters.assignedAgent);
    }

    // Date range filter
    if (filters.dateRange.from) {
      filtered = filtered.filter(lead => 
        new Date(lead.created_at) >= filters.dateRange.from!
      );
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(lead => 
        new Date(lead.created_at) <= filters.dateRange.to!
      );
    }

    setFilteredLeads(filtered);
  };

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
          // Export selected leads to CSV
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

      // Clear selection and refresh data
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
      'Status', 'Source', 'Balance', 'KYC Status', 'Created At'
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
        lead.source,
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

  // Set up real-time subscriptions
  useRealTimeData({
    onLeadsChange: () => fetchLeads(currentPage)
  });

  useEffect(() => {
    fetchLeads();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [leads, filters]);

  return {
    leads: filteredLeads,
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
    exportToCSV: () => exportToCSV(filteredLeads)
  };
};
