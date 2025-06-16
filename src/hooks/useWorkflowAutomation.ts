
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
      
      // Cast the database types to our TypeScript types
      const rules = (data || []).map(rule => ({
        ...rule,
        type: rule.type as WorkflowRule['type'],
        conditions: rule.conditions as WorkflowRule['conditions'],
        actions: rule.actions as WorkflowRule['actions']
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

  const createFollowUpReminder = async (reminderData: Omit<FollowUpReminder, 'id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert([{
          lead_id: reminderData.lead_id,
          assigned_to: reminderData.assigned_to,
          reminder_type: reminderData.reminder_type,
          title: reminderData.title,
          description: reminderData.description,
          due_date: reminderData.due_date,
          status: reminderData.status,
          priority: reminderData.priority,
          created_by: reminderData.created_by,
          completed_at: reminderData.completed_at
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
      
      // Cast the database types to our TypeScript types
      const reminders = (data || []).map(reminder => ({
        ...reminder,
        reminder_type: reminder.reminder_type as FollowUpReminder['reminder_type'],
        status: reminder.status as FollowUpReminder['status'],
        priority: reminder.priority as FollowUpReminder['priority']
      }));
      
      setReminders(reminders);
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
        .insert([{
          name: ruleData.name,
          trigger_condition: ruleData.trigger_condition,
          escalation_levels: ruleData.escalation_levels as any,
          is_active: ruleData.is_active
        }])
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
      
      // Cast the database types to our TypeScript types
      const rules = (data || []).map(rule => ({
        ...rule,
        escalation_levels: rule.escalation_levels as EscalationRule['escalation_levels']
      }));
      
      setEscalationRules(rules);
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
