
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

    const { leadId, strategy = 'round_robin' } = await req.json();

    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    console.log(`Auto-assigning lead ${leadId} using ${strategy} strategy`);

    // Fetch available agents
    const { data: agents, error: agentsError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'agent')
      .eq('status', 'active');

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    if (!agents || agents.length === 0) {
      throw new Error('No available agents found');
    }

    let selectedAgent;

    switch (strategy) {
      case 'round_robin':
        // Get agent workloads
        const { data: workloads, error: workloadError } = await supabaseClient
          .from('leads')
          .select('assigned_agent_id')
          .not('assigned_agent_id', 'is', null);

        if (workloadError) {
          throw new Error(`Failed to fetch workloads: ${workloadError.message}`);
        }

        // Count leads per agent
        const agentCounts: Record<string, number> = {};
        agents.forEach(agent => {
          agentCounts[agent.id] = 0;
        });

        workloads?.forEach(lead => {
          if (lead.assigned_agent_id && agentCounts.hasOwnProperty(lead.assigned_agent_id)) {
            agentCounts[lead.assigned_agent_id]++;
          }
        });

        // Find agent with least leads
        selectedAgent = agents.reduce((least, agent) => 
          agentCounts[agent.id] < agentCounts[least.id] ? agent : least
        );
        break;

      case 'random':
        selectedAgent = agents[Math.floor(Math.random() * agents.length)];
        break;

      default:
        selectedAgent = agents[0];
    }

    // Assign the lead
    const { error: updateError } = await supabaseClient
      .from('leads')
      .update({ 
        assigned_agent_id: selectedAgent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) {
      throw new Error(`Failed to assign lead: ${updateError.message}`);
    }

    // Log the assignment activity
    await supabaseClient
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: 'auto_assignment',
        content: `Lead automatically assigned to ${selectedAgent.first_name} ${selectedAgent.last_name} using ${strategy} strategy`,
        created_by: null
      });

    console.log(`Lead ${leadId} assigned to agent ${selectedAgent.id} (${selectedAgent.first_name} ${selectedAgent.last_name})`);

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        assignedAgent: selectedAgent,
        strategy,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in lead-auto-assign function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
