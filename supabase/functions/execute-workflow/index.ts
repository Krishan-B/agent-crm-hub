
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

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

    console.log(`Executing workflow rule ${ruleId} for lead ${leadId}`);

    // Get the workflow rule
    const { data: rule, error: ruleError } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('is_active', true)
      .single();

    if (ruleError || !rule) {
      throw new Error(`Workflow rule not found or inactive: ${ruleError?.message}`);
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        rule_id: ruleId,
        lead_id: leadId,
        status: 'running'
      })
      .select()
      .single();

    if (executionError) {
      throw new Error(`Failed to create execution record: ${executionError.message}`);
    }

    // Get lead data for condition evaluation
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    // Evaluate conditions
    const conditionsMatch = evaluateConditions(rule.conditions, lead);
    
    if (!conditionsMatch) {
      // Update execution as completed but conditions not met
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
        message: 'Workflow conditions not met'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Execute actions
    const actionResults = [];
    for (const action of rule.actions) {
      try {
        const result = await executeAction(action, lead, userId);
        actionResults.push(result);
      } catch (error) {
        console.error(`Error executing action:`, error);
        actionResults.push({ error: error.message });
      }
    }

    // Update execution as completed
    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_data: { actions: actionResults }
      })
      .eq('id', execution.id);

    return new Response(JSON.stringify({
      success: true,
      executionId: execution.id,
      results: actionResults
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in execute-workflow function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function evaluateConditions(conditions: any[], lead: any): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    const fieldValue = lead[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  });
}

async function executeAction(action: any, lead: any, userId: string): Promise<any> {
  switch (action.type) {
    case 'assign_agent':
      return await assignAgent(lead.id, action.parameters.agent_id);
    
    case 'send_email':
      return await sendEmail(lead, action.parameters);
    
    case 'create_task':
      return await createTask(lead.id, action.parameters, userId);
    
    case 'update_status':
      return await updateLeadStatus(lead.id, action.parameters.status);
    
    case 'create_reminder':
      return await createReminder(lead.id, action.parameters, userId);
    
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function assignAgent(leadId: string, agentId: string) {
  const { error } = await supabase
    .from('leads')
    .update({ assigned_agent_id: agentId })
    .eq('id', leadId);

  if (error) throw error;
  return { type: 'assign_agent', success: true, agentId };
}

async function sendEmail(lead: any, parameters: any) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: lead.email,
      subject: parameters.subject || 'Notification',
      content: parameters.content || 'You have a new message.',
      leadId: lead.id
    }
  });

  if (error) throw error;
  return { type: 'send_email', success: true, data };
}

async function createTask(leadId: string, parameters: any, userId: string) {
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .insert({
      lead_id: leadId,
      assigned_to: parameters.assigned_to || userId,
      reminder_type: 'custom',
      title: parameters.title || 'Automated Task',
      description: parameters.description,
      due_date: parameters.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: parameters.priority || 'medium',
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return { type: 'create_task', success: true, taskId: data.id };
}

async function updateLeadStatus(leadId: string, status: string) {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId);

  if (error) throw error;
  return { type: 'update_status', success: true, status };
}

async function createReminder(leadId: string, parameters: any, userId: string) {
  const { data, error } = await supabase
    .from('follow_up_reminders')
    .insert({
      lead_id: leadId,
      assigned_to: parameters.assigned_to || userId,
      reminder_type: parameters.type || 'call',
      title: parameters.title || 'Follow-up Reminder',
      description: parameters.description,
      due_date: parameters.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: parameters.priority || 'medium',
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;
  return { type: 'create_reminder', success: true, reminderId: data.id };
}

serve(handler);
