
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
}

export const useAuditLog = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createAuditLog = async (
    action: string,
    tableName?: string,
    recordId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    if (!user) return;

    setIsLogging(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: action,
        p_table_name: tableName,
        p_record_id: recordId,
        p_old_values: oldValues,
        p_new_values: newValues,
        p_ip_address: null, // Could be enhanced with actual IP detection
        p_user_agent: navigator.userAgent,
        p_session_id: null // Could be enhanced with session tracking
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating audit log:', err);
      setError('Failed to create audit log');
      throw err;
    } finally {
      setIsLogging(false);
    }
  };

  const fetchAuditLogs = async (limit: number = 100) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLog[];
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs');
      throw err;
    }
  };

  return {
    isLogging,
    error,
    createAuditLog,
    fetchAuditLogs
  };
};
