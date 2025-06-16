
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { WorkflowRule, WorkflowExecution, FollowUpReminder, EscalationRule } from '../types/workflow';

export const useWorkflowAutomation = () => {
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
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
      setWorkflowRules(data || []);
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
          ...ruleData,
          created_by: user.id
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
      const { error } = await supabase
        .from('workflow_rules')
        .update(updates)
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

  const createFollowUpReminder = async (reminderData: Omit<FollowUpReminder, 'id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert([{
          ...reminderData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchReminders();
      return data;
    } catch (err) {
      console.error('Error creating follow-up reminder:', err);
      throw err;
    }
  };

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select(`
          *,
          lead:leads(first_name, last_name, email),
          assigned_user:profiles!assigned_to(first_name, last_name)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to fetch reminders');
    }
  };

  const completeReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('follow_up_reminders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchReminders();
    } catch (err) {
      console.error('Error completing reminder:', err);
      throw err;
    }
  };

  const createEscalationRule = async (ruleData: Omit<EscalationRule, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .insert([ruleData])
        .select()
        .single();

      if (error) throw error;
      await fetchEscalationRules();
      return data;
    } catch (err) {
      console.error('Error creating escalation rule:', err);
      throw err;
    }
  };

  const fetchEscalationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEscalationRules(data || []);
    } catch (err) {
      console.error('Error fetching escalation rules:', err);
      setError('Failed to fetch escalation rules');
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkflowRules();
      fetchReminders();
      fetchEscalationRules();
    }
  }, [user]);

  return {
    workflowRules,
    executions,
    reminders,
    escalationRules,
    isLoading,
    error,
    createWorkflowRule,
    updateWorkflowRule,
    deleteWorkflowRule,
    executeWorkflow,
    createFollowUpReminder,
    completeReminder,
    createEscalationRule,
    fetchWorkflowRules,
    fetchReminders,
    fetchEscalationRules
  };
};
