
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { operation, leadIds, data, userId } = await req.json();

    if (!operation || !leadIds || !Array.isArray(leadIds)) {
      throw new Error('Operation and leadIds array are required');
    }

    console.log(`Performing batch operation: ${operation} on ${leadIds.length} leads`);

    const results = [];
    const errors = [];

    for (const leadId of leadIds) {
      try {
        let result;

        switch (operation) {
          case 'update_status':
            if (!data?.status) {
              throw new Error('Status is required for update_status operation');
            }
            
            const { error: updateError } = await supabaseClient
              .from('leads')
              .update({ 
                status: data.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', leadId);

            if (updateError) throw updateError;

            // Log activity
            await supabaseClient
              .from('lead_activities')
              .insert({
                lead_id: leadId,
                activity_type: 'batch_status_update',
                content: `Status updated to ${data.status} via batch operation`,
                created_by: userId
              });

            result = { leadId, operation: 'status_updated', newStatus: data.status };
            break;

          case 'assign_agent':
            if (!data?.agentId) {
              throw new Error('Agent ID is required for assign_agent operation');
            }

            const { error: assignError } = await supabaseClient
              .from('leads')
              .update({ 
                assigned_agent_id: data.agentId,
                updated_at: new Date().toISOString()
              })
              .eq('id', leadId);

            if (assignError) throw assignError;

            // Get agent name for activity log
            const { data: agent } = await supabaseClient
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', data.agentId)
              .single();

            await supabaseClient
              .from('lead_activities')
              .insert({
                lead_id: leadId,
                activity_type: 'batch_assignment',
                content: `Assigned to ${agent?.first_name} ${agent?.last_name} via batch operation`,
                created_by: userId
              });

            result = { leadId, operation: 'agent_assigned', agentId: data.agentId };
            break;

          case 'add_tag':
            if (!data?.tag) {
              throw new Error('Tag is required for add_tag operation');
            }

            await supabaseClient
              .from('lead_activities')
              .insert({
                lead_id: leadId,
                activity_type: 'tag_added',
                content: `Tag added: ${data.tag} via batch operation`,
                created_by: userId
              });

            result = { leadId, operation: 'tag_added', tag: data.tag };
            break;

          case 'add_comment':
            if (!data?.comment) {
              throw new Error('Comment is required for add_comment operation');
            }

            await supabaseClient
              .from('lead_activities')
              .insert({
                lead_id: leadId,
                activity_type: 'batch_comment',
                content: data.comment,
                created_by: userId
              });

            result = { leadId, operation: 'comment_added' };
            break;

          case 'export_data':
            const { data: leadData, error: exportError } = await supabaseClient
              .from('leads')
              .select(`
                *,
                assigned_agent:profiles!assigned_agent_id(first_name, last_name),
                lead_activities(*),
                transactions(*)
              `)
              .eq('id', leadId)
              .single();

            if (exportError) throw exportError;

            result = { leadId, operation: 'data_exported', data: leadData };
            break;

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push(result);

      } catch (error) {
        console.error(`Error processing lead ${leadId}:`, error);
        errors.push({ leadId, error: error.message });
      }
    }

    console.log(`Batch operation completed. Success: ${results.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        processed: leadIds.length,
        results,
        errors,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in batch-operations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
