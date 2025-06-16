
import { useState } from 'react';
import type { WorkflowExecution } from '../types/workflow';
import { useWorkflowRules } from './useWorkflowRules';
import { useFollowUpReminders } from './useFollowUpReminders';
import { useEscalationRules } from './useEscalationRules';

export const useWorkflowAutomation = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);

  // Compose the smaller hooks
  const workflowRulesHook = useWorkflowRules();
  const followUpRemindersHook = useFollowUpReminders();
  const escalationRulesHook = useEscalationRules();

  // Combine loading states
  const isLoading = workflowRulesHook.isLoading || followUpRemindersHook.isLoading || escalationRulesHook.isLoading;

  // Combine error states
  const error = workflowRulesHook.error || followUpRemindersHook.error || escalationRulesHook.error;

  return {
    // Workflow rules
    workflowRules: workflowRulesHook.workflowRules,
    createWorkflowRule: workflowRulesHook.createWorkflowRule,
    updateWorkflowRule: workflowRulesHook.updateWorkflowRule,
    deleteWorkflowRule: workflowRulesHook.deleteWorkflowRule,
    executeWorkflow: workflowRulesHook.executeWorkflow,
    fetchWorkflowRules: workflowRulesHook.fetchWorkflowRules,

    // Follow-up reminders
    reminders: followUpRemindersHook.reminders,
    createFollowUpReminder: followUpRemindersHook.createFollowUpReminder,
    completeReminder: followUpRemindersHook.completeReminder,
    fetchReminders: followUpRemindersHook.fetchReminders,

    // Escalation rules
    escalationRules: escalationRulesHook.escalationRules,
    createEscalationRule: escalationRulesHook.createEscalationRule,
    fetchEscalationRules: escalationRulesHook.fetchEscalationRules,

    // Shared state
    executions,
    isLoading,
    error
  };
};
