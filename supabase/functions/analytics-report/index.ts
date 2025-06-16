
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
    const { dateRange = '30d' } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate date range
    const days = parseInt(dateRange.replace('d', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch leads data
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', startDateStr)

    // Fetch activities data
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .gte('created_at', startDateStr)

    // Fetch transactions data
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startDateStr)

    // Fetch communications data
    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .gte('created_at', startDateStr)

    // Generate analytics
    const analytics = {
      leads: {
        total: leads?.length || 0,
        byStatus: leads?.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {},
        byCountry: leads?.reduce((acc, lead) => {
          acc[lead.country] = (acc[lead.country] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {},
        conversionRate: leads?.length ? 
          (leads.filter(l => l.balance > 0).length / leads.length) * 100 : 0
      },
      
      financial: {
        totalDeposits: transactions?.reduce((sum, t) => 
          t.type === 'deposit' ? sum + Number(t.amount) : sum, 0) || 0,
        averageDeposit: transactions?.filter(t => t.type === 'deposit').length ? 
          (transactions.reduce((sum, t) => t.type === 'deposit' ? sum + Number(t.amount) : sum, 0) / 
           transactions.filter(t => t.type === 'deposit').length) : 0,
        byType: transactions?.reduce((acc, transaction) => {
          acc[transaction.type] = (acc[transaction.type] || 0) + Number(transaction.amount)
          return acc
        }, {} as Record<string, number>) || {}
      },
      
      activities: {
        total: activities?.length || 0,
        byType: activities?.reduce((acc, activity) => {
          acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {},
        engagement: leads?.length ? (activities?.length || 0) / leads.length : 0
      },
      
      communications: {
        total: communications?.length || 0,
        byType: communications?.reduce((acc, comm) => {
          acc[comm.type] = (acc[comm.type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {},
        byStatus: communications?.reduce((acc, comm) => {
          acc[comm.status] = (acc[comm.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      }
    }

    return new Response(
      JSON.stringify({ 
        analytics,
        dateRange,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analytics-report:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
