
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leadId } = await req.json()
    
    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'Lead ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch lead data and related information
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Fetch activities
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)

    // Fetch communications
    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .eq('lead_id', leadId)

    // Fetch transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('lead_id', leadId)

    // Calculate scoring factors
    const activityScore = Math.min((activities?.length || 0) * 2, 30)
    const communicationScore = Math.min((communications?.length || 0) * 3, 25)
    
    const depositAmount = transactions?.reduce((sum, t) => 
      t.type === 'deposit' ? sum + Number(t.amount) : sum, 0) || 0
    const depositScore = Math.min(depositAmount / 100, 25)
    
    const kycScore = lead.kyc_status === 'approved' ? 20 : 
                    lead.kyc_status === 'pending' ? 10 : 0

    const totalScore = Math.round(activityScore + communicationScore + depositScore + kycScore)

    const scoreFactors = {
      activity_level: activityScore,
      engagement_quality: communicationScore,
      deposit_potential: depositScore,
      kyc_completion: kycScore,
      total_activities: activities?.length || 0,
      total_communications: communications?.length || 0,
      total_deposits: depositAmount,
      kyc_status: lead.kyc_status
    }

    // Save the score
    const { error: insertError } = await supabase
      .from('lead_scores')
      .insert({
        lead_id: leadId,
        score: totalScore,
        score_factors: scoreFactors,
        calculated_by: 'ai_system',
        version: '1.0'
      })

    if (insertError) {
      console.error('Error saving lead score:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        score: totalScore,
        scoreFactors,
        message: 'Lead score calculated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-lead-scoring:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
