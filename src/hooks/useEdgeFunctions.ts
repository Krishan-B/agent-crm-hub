
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const useEdgeFunctions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const executeFunction = async (functionName: string, payload: any = {}) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Executing edge function: ${functionName}`, payload);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        throw error;
      }

      console.log(`Edge function ${functionName} response:`, data);
      return data;
    } catch (err) {
      console.error(`Error executing ${functionName}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLeadScore = async (leadId: string) => {
    return executeFunction('ai-lead-scoring', { leadId });
  };

  const generateAnalyticsReport = async (dateRange: string = '30d') => {
    return executeFunction('analytics-report', { dateRange });
  };

  const autoAssignLead = async (leadId: string, strategy: string = 'round_robin') => {
    return executeFunction('lead-auto-assign', { leadId, strategy });
  };

  const executeBatchOperation = async (operation: string, leadIds: string[], data?: any) => {
    return executeFunction('batch-operations', {
      operation,
      leadIds,
      data,
      userId: user?.id
    });
  };

  return {
    isLoading,
    error,
    generateLeadScore,
    generateAnalyticsReport,
    autoAssignLead,
    executeBatchOperation,
    executeFunction
  };
};
