
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface ArchiveStatistics {
  totalLeads: number;
  activeLeads: number;
  archivedLeads: number;
  oldestActiveDate: string;
  newestArchivedDate: string;
}

interface ArchiveResult {
  archived: number;
  errors: string[];
}

interface RestoreResult {
  restored: number;
  errors: string[];
}

interface DeleteResult {
  deleted: number;
  errors: string[];
}

export const useDataArchiving = () => {
  const [archiveStats, setArchiveStats] = useState<ArchiveStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getArchiveStatistics = async (): Promise<ArchiveStatistics> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get total counts
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      const { count: archivedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'archived');

      const activeLeads = (totalLeads || 0) - (archivedLeads || 0);

      // Get date information
      const { data: oldestActive } = await supabase
        .from('leads')
        .select('created_at')
        .neq('status', 'archived')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const { data: newestArchived } = await supabase
        .from('leads')
        .select('created_at')
        .eq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const stats: ArchiveStatistics = {
        totalLeads: totalLeads || 0,
        activeLeads,
        archivedLeads: archivedLeads || 0,
        oldestActiveDate: oldestActive?.created_at || '',
        newestArchivedDate: newestArchived?.created_at || ''
      };

      setArchiveStats(stats);
      return stats;
    } catch (error) {
      console.error('Error getting archive statistics:', error);
      throw error;
    }
  };

  const archiveLeads = async (criteria: any): Promise<ArchiveResult> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    const result: ArchiveResult = { archived: 0, errors: [] };

    try {
      let query = supabase
        .from('leads')
        .select('id')
        .neq('status', 'archived'); // Don't archive already archived leads

      // Apply criteria
      if (criteria.olderThan) {
        query = query.lt('created_at', criteria.olderThan.toISOString());
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.dateRange) {
        query = query
          .gte('created_at', criteria.dateRange.from.toISOString())
          .lte('created_at', criteria.dateRange.to.toISOString());
      }

      const { data: leadsToArchive, error: selectError } = await query;

      if (selectError) throw selectError;

      if (!leadsToArchive || leadsToArchive.length === 0) {
        return result;
      }

      // Archive leads in batches
      const batchSize = 100;
      for (let i = 0; i < leadsToArchive.length; i += batchSize) {
        const batch = leadsToArchive.slice(i, i + batchSize);
        const leadIds = batch.map(lead => lead.id);

        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .in('id', leadIds);

        if (updateError) {
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${updateError.message}`);
        } else {
          result.archived += batch.length;
        }
      }

      // Log the archive operation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'bulk_archive',
          table_name: 'leads',
          new_values: { 
            criteria, 
            archived_count: result.archived 
          }
        });

    } catch (error: any) {
      result.errors.push(error.message);
    } finally {
      setIsLoading(false);
    }

    return result;
  };

  const restoreLeads = async (criteria: any = {}): Promise<RestoreResult> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    const result: RestoreResult = { restored: 0, errors: [] };

    try {
      let query = supabase
        .from('leads')
        .select('id')
        .eq('status', 'archived');

      // Apply restoration criteria if provided
      if (criteria.dateRange) {
        query = query
          .gte('created_at', criteria.dateRange.from.toISOString())
          .lte('created_at', criteria.dateRange.to.toISOString());
      }

      const { data: leadsToRestore, error: selectError } = await query;

      if (selectError) throw selectError;

      if (!leadsToRestore || leadsToRestore.length === 0) {
        return result;
      }

      // Restore leads in batches
      const batchSize = 100;
      for (let i = 0; i < leadsToRestore.length; i += batchSize) {
        const batch = leadsToRestore.slice(i, i + batchSize);
        const leadIds = batch.map(lead => lead.id);

        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            status: 'inactive', // Restore to inactive status
            updated_at: new Date().toISOString()
          })
          .in('id', leadIds);

        if (updateError) {
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${updateError.message}`);
        } else {
          result.restored += batch.length;
        }
      }

      // Log the restore operation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'bulk_restore',
          table_name: 'leads',
          new_values: { 
            criteria, 
            restored_count: result.restored 
          }
        });

    } catch (error: any) {
      result.errors.push(error.message);
    } finally {
      setIsLoading(false);
    }

    return result;
  };

  const deleteArchivedLeads = async (): Promise<DeleteResult> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    const result: DeleteResult = { deleted: 0, errors: [] };

    try {
      // First, get count of archived leads
      const { count: archivedCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'archived');

      if (!archivedCount || archivedCount === 0) {
        return result;
      }

      // Delete archived leads
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('status', 'archived');

      if (deleteError) {
        result.errors.push(deleteError.message);
      } else {
        result.deleted = archivedCount;
      }

      // Log the deletion operation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'permanent_delete_archived',
          table_name: 'leads',
          new_values: { 
            deleted_count: result.deleted 
          }
        });

    } catch (error: any) {
      result.errors.push(error.message);
    } finally {
      setIsLoading(false);
    }

    return result;
  };

  return {
    archiveLeads,
    restoreLeads,
    deleteArchivedLeads,
    getArchiveStatistics,
    archiveStats,
    isLoading
  };
};
