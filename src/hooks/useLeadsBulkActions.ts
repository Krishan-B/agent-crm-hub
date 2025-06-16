
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from './useOptimizedLeads';

export interface BulkAction {
  type: 'assign' | 'status_change' | 'export' | 'delete';
  data?: any;
}

export const useLeadsBulkActions = (
  selectedLeads: string[],
  setSelectedLeads: (leads: string[]) => void,
  onDataChange: () => void
) => {
  const [error, setError] = useState<string | null>(null);

  const performBulkAction = async (action: BulkAction) => {
    if (selectedLeads.length === 0) return;

    try {
      setError(null);
      
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

        case 'delete':
          const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .in('id', selectedLeads);

          if (deleteError) throw deleteError;
          break;
      }

      setSelectedLeads([]);
      onDataChange();
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

  return {
    performBulkAction,
    exportToCSV,
    bulkActionError: error,
  };
};
