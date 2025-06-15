
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { leadId } = await req.json();

    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    // Fetch lead data with activities and transactions
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select(`
        *,
        lead_activities(count),
        transactions(*)
      `)
      .eq('id', leadId)
      .single();

    if (leadError) {
      throw new Error(`Failed to fetch lead: ${leadError.message}`);
    }

    // Calculate AI score based on various factors
    let score = 0;
    const factors = [];

    // Country scoring (example weights)
    const countryScores: Record<string, number> = {
      'United States': 25,
      'United Kingdom': 22,
      'Canada': 20,
      'Australia': 18,
      'Germany': 15,
      'France': 12,
      'Spain': 10,
      'Italy': 8,
    };

    const countryScore = countryScores[lead.country] || 5;
    score += countryScore;
    factors.push(`Country (${lead.country}): +${countryScore}`);

    // Balance and transaction activity
    const totalDeposits = lead.transactions
      ?.filter((t: any) => t.type === 'deposit')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0;

    if (totalDeposits > 5000) {
      score += 30;
      factors.push('High deposit volume: +30');
    } else if (totalDeposits > 1000) {
      score += 20;
      factors.push('Medium deposit volume: +20');
    } else if (totalDeposits > 0) {
      score += 10;
      factors.push('Has made deposits: +10');
    }

    // KYC status
    switch (lead.kyc_status) {
      case 'approved':
        score += 25;
        factors.push('KYC approved: +25');
        break;
      case 'submitted':
      case 'pending':
        score += 15;
        factors.push('KYC submitted: +15');
        break;
      default:
        factors.push('No KYC: +0');
    }

    // Activity level
    const activityCount = lead.lead_activities?.[0]?.count || 0;
    if (activityCount > 10) {
      score += 15;
      factors.push('High activity: +15');
    } else if (activityCount > 5) {
      score += 10;
      factors.push('Medium activity: +10');
    } else if (activityCount > 0) {
      score += 5;
      factors.push('Some activity: +5');
    }

    // Registration recency (boost for recent registrations)
    const registrationDate = new Date(lead.registration_date);
    const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceRegistration <= 7) {
      score += 10;
      factors.push('Recent registration: +10');
    } else if (daysSinceRegistration <= 30) {
      score += 5;
      factors.push('Registration within month: +5');
    }

    // Normalize score to 0-100
    const finalScore = Math.min(Math.max(score, 0), 100);

    // Determine score category
    let category = 'Cold';
    if (finalScore >= 80) category = 'Hot';
    else if (finalScore >= 60) category = 'Warm';
    else if (finalScore >= 40) category = 'Lukewarm';

    // Store the score in lead_activities
    await supabaseClient
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: 'ai_score',
        content: `AI Score: ${finalScore} (${category}) - Factors: ${factors.join(', ')}`
      });

    console.log(`AI Lead Scoring completed for lead ${leadId}: ${finalScore} (${category})`);

    return new Response(
      JSON.stringify({
        leadId,
        score: finalScore,
        category,
        factors,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-lead-scoring function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
