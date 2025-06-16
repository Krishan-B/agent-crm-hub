
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowExecutionRequest {
  ruleId: string;
  leadId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ruleId, leadId, userId }: WorkflowExecutionRequest = await req.json();
    
    console.log('Executing workflow:', { ruleId, leadId, userId });

    // Get the workflow rule
    const { data: rule, error: ruleError } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError || !rule) {
      throw new Error('Workflow rule not found');
    }

    if (!rule.is_active) {
      throw new Error('Workflow rule is not active');
    }

    // Get the lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert([{
        rule_id: ruleId,
        lead_id: leadId,
        status: 'running',
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (executionError) {
      throw new Error('Failed to create execution record');
    }

    // Check conditions
    const conditionsMet = evaluateConditions(rule.conditions, lead);
    
    if (!conditionsMet) {
      // Update execution as completed but no actions taken
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_data: { message: 'Conditions not met' }
        })
        .eq('id', execution.id);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Workflow conditions not met',
        execution_id: execution.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Execute actions
    const results = [];
    for (const action of rule.actions) {
      try {
        const result = await executeAction(action, lead, userId);
        results.push(result);
      } catch (error) {
        console.error('Action execution error:', error);
        results.push({ error: error.message });
      }
    }

    // Update execution as completed
    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_data: { actions: results }
      })
      .eq('id', execution.id);

    console.log('Workflow executed successfully:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      execution_id: execution.id,
      results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Workflow execution error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function evaluateConditions(conditions: any[], leadData: any): boolean {
  if (!conditions || conditions.length === 0) return true;

  for (const condition of conditions) {
    const fieldValue = leadData[condition.field];
    let conditionMet = false;

    switch (condition.operator) {
      case 'equals':
        conditionMet = fieldValue === condition.value;
        break;
      case 'not_equals':
        conditionMet = fieldValue !== condition.value;
        break;
      case 'contains':
        conditionMet = fieldValue?.toString().includes(condition.value);
        break;
      case 'greater_than':
        conditionMet = parseFloat(fieldValue) > parseFloat(condition.value);
        break;
      case 'less_than':
        conditionMet = parseFloat(fieldValue) < parseFloat(condition.value);
        break;
      case 'in':
        conditionMet = Array.isArray(condition.value) && condition.value.includes(fieldValue);
        break;
      case 'not_in':
        conditionMet = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        break;
    }

    // For now, use AND logic between conditions
    if (!conditionMet) return false;
  }

  return true;
}

async function executeAction(action: any, leadData: any, userId: string): Promise<any> {
  switch (action.type) {
    case 'assign_agent':
      return await executeLeadAssignment(action, leadData);
    
    case 'send_email':
      return await executeSendEmail(action, leadData, userId);
    
    case 'create_task':
      return await executeCreateTask(action, leadData, userId);
    
    case 'update_status':
      return await executeUpdateStatus(action, leadData);
    
    case 'create_reminder':
      return await executeCreateReminder(action, leadData, userId);
    
    case 'escalate':
      return await executeEscalate(action, leadData, userId);
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function executeLeadAssignment(action: any, leadData: any): Promise<any> {
  const strategy = action.parameters.strategy || 'round_robin';
  
  if (strategy === 'specific_agent') {
    const agentId = action.parameters.agent_id;
    if (!agentId) {
      throw new Error('Agent ID required for specific agent assignment');
    }
    
    const { error } = await supabase
      .from('leads')
      .update({ assigned_agent_id: agentId })
      .eq('id', leadData.id);
    
    if (error) throw error;
    
    return { type: 'assign_agent', agent_id: agentId, strategy: 'specific_agent' };
  }
  
  // Use the existing lead auto-assign function
  const { data, error } = await supabase.functions.invoke('lead-auto-assign', {
    body: { leadId: leadData.id, strategy }
  });
  
  if (error) throw error;
  
  return { type: 'assign_agent', result: data, strategy };
}

async function executeSendEmail(action: any, leadData: any, userId: string): Promise<any> {
  const emailData = {
    leadId: leadData.id,
    type: 'email',
    subject: action.parameters.subject || 'Automated Email',
    content: action.parameters.content || '',
    recipientEmail: leadData.email,
    templateId: action.parameters.template_id
  };
  
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: emailData
  });
  
  if (error) throw error;
  
  return { type: 'send_email', result: data };
}

async function executeCreateTask(action: any, leadData: any, userId: string): Promise<any> {
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .insert([{
      lead_id: leadData.id,
      assigned_to: leadData.assigned_agent_id || userId,
      reminder_type: 'custom',
      title: action.parameters.title || 'Automated Task',
      description: action.parameters.description || '',
      due_date: new Date(Date.now() + (action.parameters.delay_hours || 24) * 60 * 60 * 1000).toISOString(),
      priority: action.parameters.priority || 'medium',
      status: 'pending',
      created_by: userId
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return { type: 'create_task', task_id: data.id };
}

async function executeUpdateStatus(action: any, leadData: any): Promise<any> {
  const { error } = await supabase
    .from('leads')
    .update({ status: action.parameters.status })
    .eq('id', leadData.id);
  
  if (error) throw error;
  
  return { type: 'update_status', new_status: action.parameters.status };
}

async function executeCreateReminder(action: any, leadData: any, userId: string): Promise<any> {
  const dueDate = new Date(Date.now() + (action.parameters.delay_hours || 24) * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .insert([{
      lead_id: leadData.id,
      assigned_to: leadData.assigned_agent_id || userId,
      reminder_type: action.parameters.reminder_type || 'custom',
      title: action.parameters.title || 'Follow-up Reminder',
      description: action.parameters.description || '',
      due_date: dueDate.toISOString(),
      priority: action.parameters.priority || 'medium',
      status: 'pending',
      created_by: userId
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return { type: 'create_reminder', reminder_id: data.id };
}

async function executeEscalate(action: any, leadData: any, userId: string): Promise<any> {
  // Create notification for escalation
  const escalateTo = action.parameters.escalate_to;
  if (!escalateTo || escalateTo.length === 0) {
    throw new Error('No escalation targets specified');
  }
  
  const notifications = [];
  for (const targetId of escalateTo) {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: targetId,
      p_title: 'Lead Escalation',
      p_message: `Lead ${leadData.first_name} ${leadData.last_name} has been escalated`,
      p_type: 'escalation',
      p_priority: 'high',
      p_data: { lead_id: leadData.id, escalated_by: userId },
      p_related_entity_type: 'lead',
      p_related_entity_id: leadData.id
    });
    
    if (error) {
      console.error('Failed to create escalation notification:', error);
    } else {
      notifications.push(data);
    }
  }
  
  return { type: 'escalate', notifications, escalated_to: escalateTo };
}

serve(handler);
