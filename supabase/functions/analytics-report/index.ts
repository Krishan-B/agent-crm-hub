
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

    const { dateRange = '30d' } = await req.json();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    console.log(`Generating analytics report for ${dateRange} (${startDate.toISOString()} to ${endDate.toISOString()})`);

    // Fetch leads data
    const { data: leads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    // Fetch transactions data
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (transactionsError) {
      throw new Error(`Failed to fetch transactions: ${transactionsError.message}`);
    }

    // Fetch activities data
    const { data: activities, error: activitiesError } = await supabaseClient
      .from('lead_activities')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (activitiesError) {
      throw new Error(`Failed to fetch activities: ${activitiesError.message}`);
    }

    // Calculate analytics
    const analytics = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        range: dateRange
      },
      leads: {
        total: leads?.length || 0,
        byStatus: {},
        byCountry: {},
        byKycStatus: {},
        conversionRate: 0
      },
      financial: {
        totalDeposits: 0,
        totalBonuses: 0,
        totalVolume: 0,
        averageDeposit: 0,
        transactionCount: 0
      },
      activities: {
        total: activities?.length || 0,
        byType: {},
        engagement: 0
      },
      trends: {
        dailyRegistrations: {},
        dailyDeposits: {},
        dailyActivities: {}
      }
    };

    // Process leads analytics
    if (leads) {
      leads.forEach(lead => {
        // By status
        analytics.leads.byStatus[lead.status] = (analytics.leads.byStatus[lead.status] || 0) + 1;
        
        // By country
        analytics.leads.byCountry[lead.country] = (analytics.leads.byCountry[lead.country] || 0) + 1;
        
        // By KYC status
        analytics.leads.byKycStatus[lead.kyc_status || 'not_submitted'] = 
          (analytics.leads.byKycStatus[lead.kyc_status || 'not_submitted'] || 0) + 1;

        // Daily trends
        const day = lead.created_at.split('T')[0];
        analytics.trends.dailyRegistrations[day] = (analytics.trends.dailyRegistrations[day] || 0) + 1;
      });

      // Calculate conversion rate (leads with deposits / total leads)
      const leadsWithDeposits = leads.filter(lead => parseFloat(lead.balance) > 0).length;
      analytics.leads.conversionRate = leads.length > 0 ? (leadsWithDeposits / leads.length) * 100 : 0;
    }

    // Process transactions analytics
    if (transactions) {
      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        analytics.financial.transactionCount++;
        analytics.financial.totalVolume += amount;

        if (transaction.type === 'deposit') {
          analytics.financial.totalDeposits += amount;
        } else if (transaction.type === 'bonus') {
          analytics.financial.totalBonuses += amount;
        }

        // Daily trends
        const day = transaction.created_at.split('T')[0];
        analytics.trends.dailyDeposits[day] = (analytics.trends.dailyDeposits[day] || 0) + amount;
      });

      analytics.financial.averageDeposit = analytics.financial.transactionCount > 0 
        ? analytics.financial.totalDeposits / analytics.financial.transactionCount 
        : 0;
    }

    // Process activities analytics
    if (activities) {
      activities.forEach(activity => {
        analytics.activities.byType[activity.activity_type] = 
          (analytics.activities.byType[activity.activity_type] || 0) + 1;

        // Daily trends
        const day = activity.created_at.split('T')[0];
        analytics.trends.dailyActivities[day] = (analytics.trends.dailyActivities[day] || 0) + 1;
      });

      // Calculate engagement (activities per lead)
      analytics.activities.engagement = analytics.leads.total > 0 
        ? analytics.activities.total / analytics.leads.total 
        : 0;
    }

    console.log('Analytics report generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analytics,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analytics-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
