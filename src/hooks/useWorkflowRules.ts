
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { WorkflowRule } from '../types/workflow';

export const useWorkflowRules = () => {
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWorkflowRules = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      
      // Safely cast the database types to our TypeScript types
      const rules = (data || []).map(rule => ({
        ...rule,
        type: rule.type as WorkflowRule['type'],
        conditions: Array.isArray(rule.conditions) ? rule.conditions as unknown as WorkflowRule['conditions'] : [],
        actions: Array.isArray(rule.actions) ? rule.actions as unknown as WorkflowRule['actions'] : []
      }));
      
      setWorkflowRules(rules);
    } catch (err) {
      console.error('Error fetching workflow rules:', err);
      setError('Failed to fetch workflow rules');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkflowRule = async (ruleData: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('workflow_rules')
        .insert([{
          name: ruleData.name,
          type: ruleData.type,
          conditions: ruleData.conditions as any,
          actions: ruleData.actions as any,
          is_active: ruleData.is_active,
          priority: ruleData.priority,
          created_by: ruleData.created_by
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchWorkflowRules();
      return data;
    } catch (err) {
      console.error('Error creating workflow rule:', err);
      throw err;
    }
  };

  const updateWorkflowRule = async (id: string, updates: Partial<WorkflowRule>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.actions !== undefined) updateData.actions = updates.actions;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { error } = await supabase
        .from('workflow_rules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchWorkflowRules();
    } catch (err) {
      console.error('Error updating workflow rule:', err);
      throw err;
    }
  };

  const deleteWorkflowRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflow_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchWorkflowRules();
    } catch (err) {
      console.error('Error deleting workflow rule:', err);
      throw err;
    }
  };

  const executeWorkflow = async (ruleId: string, leadId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.functions.invoke('execute-workflow', {
        body: { ruleId, leadId, userId: user.id }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error executing workflow:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkflowRules();
    }
  }, [user]);

  return {
    workflowRules,
    isLoading,
    error,
    createWorkflowRule,
    updateWorkflowRule,
    deleteWorkflowRule,
    executeWorkflow,
    fetchWorkflowRules
  };
};
