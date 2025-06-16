
export interface WorkflowRule {
  id: string;
  name: string;
  type: 'lead_assignment' | 'email_automation' | 'follow_up' | 'escalation';
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  priority: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic?: 'and' | 'or';
}

export interface WorkflowAction {
  type: 'assign_agent' | 'send_email' | 'create_task' | 'update_status' | 'create_reminder' | 'escalate';
  parameters: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  rule_id: string;
  lead_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  result_data?: Record<string, any>;
}

export interface FollowUpReminder {
  id: string;
  lead_id: string;
  assigned_to: string;
  reminder_type: 'call' | 'email' | 'meeting' | 'custom';
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  trigger_condition: string;
  escalation_levels: EscalationLevel[];
  is_active: boolean;
  created_at: string;
}

export interface EscalationLevel {
  level: number;
  delay_hours: number;
  escalate_to: string[];
  action_type: 'notify' | 'reassign' | 'create_task';
  message_template?: string;
}
