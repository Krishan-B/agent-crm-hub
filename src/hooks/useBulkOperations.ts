
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { downloadBlob } from '../utils/fileUtils';

interface ExportOptions {
  format: 'csv' | 'xlsx';
  includeArchived?: boolean;
  filters?: any;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export const useBulkOperations = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { user } = useAuth();

  const importLeads = async (data: any[], mode: 'create' | 'update'): Promise<ImportResult> => {
    if (!user) throw new Error('User not authenticated');

    const result: ImportResult = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const [index, lead] of data.entries()) {
      try {
        if (mode === 'create') {
          const { error } = await supabase
            .from('leads')
            .insert([{
              first_name: lead.first_name,
              last_name: lead.last_name,
              email: lead.email,
              phone: lead.phone || null,
              country: lead.country,
              status: lead.status || 'new',
              balance: parseFloat(lead.balance) || 0,
              bonus_amount: parseFloat(lead.bonus_amount) || 0,
              kyc_status: lead.kyc_status || 'not_submitted'
            }]);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('leads')
            .update({
              first_name: lead.first_name,
              last_name: lead.last_name,
              phone: lead.phone || null,
              country: lead.country,
              status: lead.status || 'new',
              balance: parseFloat(lead.balance) || 0,
              bonus_amount: parseFloat(lead.bonus_amount) || 0,
              kyc_status: lead.kyc_status || 'not_submitted',
              updated_at: new Date().toISOString()
            })
            .eq('email', lead.email);

          if (error) throw error;
        }

        result.successful++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: lead._rowNumber || index + 1,
          error: error.message,
          data: lead
        });
      }
    }

    return result;
  };

  const exportLeads = async (options: ExportOptions) => {
    if (!user) throw new Error('User not authenticated');

    setIsExporting(true);
    setExportProgress(0);

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

      // Apply filters
      if (options.filters) {
        // Add filter logic here based on options.filters
      }

      if (!options.includeArchived) {
        query = query.neq('status', 'archived');
      }

      setExportProgress(30);

      const { data, error } = await query;
      if (error) throw error;

      setExportProgress(60);

      // Convert to CSV format
      const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Country',
        'Status', 'Balance', 'Bonus Amount', 'KYC Status', 'Assigned Agent',
        'Created At', 'Updated At'
      ];

      const csvContent = [
        headers.join(','),
        ...(data || []).map(lead => [
          lead.id,
          `"${lead.first_name}"`,
          `"${lead.last_name}"`,
          lead.email,
          lead.phone || '',
          lead.country,
          lead.status,
          lead.balance,
          lead.bonus_amount,
          lead.kyc_status,
          lead.assigned_agent ? `"${lead.assigned_agent.first_name} ${lead.assigned_agent.last_name}"` : '',
          lead.created_at,
          lead.updated_at
        ].join(','))
      ].join('\n');

      setExportProgress(90);

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      downloadBlob(blob, filename);

      setExportProgress(100);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  return {
    importLeads,
    exportLeads,
    isExporting,
    exportProgress
  };
};
