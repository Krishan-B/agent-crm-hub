
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/functions/v1/api', '');
    const method = req.method;

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid API key' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Verify API key (in a real implementation, you'd validate this against a database)
    if (!apiKey.startsWith('api_')) {
      return new Response(JSON.stringify({ error: 'Invalid API key format' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Route to appropriate handler
    if (path.startsWith('/leads')) {
      return await handleLeadsAPI(path, method, req, url);
    } else if (path.startsWith('/communications')) {
      return await handleCommunicationsAPI(path, method, req, url);
    } else if (path.startsWith('/analytics')) {
      return await handleAnalyticsAPI(path, method, req, url);
    } else {
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in API function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function handleLeadsAPI(path: string, method: string, req: Request, url: URL): Promise<Response> {
  const pathParts = path.split('/').filter(p => p);
  
  if (method === 'GET' && pathParts.length === 1) {
    // GET /leads - List all leads
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } else if (method === 'POST' && pathParts.length === 1) {
    // POST /leads - Create new lead
    const leadData = await req.json();
    
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } else if (method === 'GET' && pathParts.length === 2) {
    // GET /leads/{id} - Get specific lead
    const leadId = pathParts[1];
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } else if (method === 'PUT' && pathParts.length === 2) {
    // PUT /leads/{id} - Update lead
    const leadId = pathParts[1];
    const updateData = await req.json();
    
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function handleCommunicationsAPI(path: string, method: string, req: Request, url: URL): Promise<Response> {
  if (method === 'POST') {
    // POST /communications - Send communication
    const { lead_id, type, subject, content } = await req.json();
    
    const { data, error } = await supabase
      .from('communications')
      .insert([{
        lead_id,
        type,
        subject,
        content,
        status: 'sent',
        sent_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function handleAnalyticsAPI(path: string, method: string, req: Request, url: URL): Promise<Response> {
  if (method === 'GET') {
    const period = url.searchParams.get('period') || '30d';
    const metrics = url.searchParams.get('metrics')?.split(',') || ['leads', 'conversions'];
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    const analyticsData: any = {};

    if (metrics.includes('leads')) {
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());
      
      analyticsData.leads = { total: totalLeads };
    }

    if (metrics.includes('conversions')) {
      const { count: conversions } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gt('balance', 0)
        .gte('created_at', startDate.toISOString());
      
      analyticsData.conversions = { total: conversions };
    }

    return new Response(JSON.stringify({ 
      data: analyticsData,
      period,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

serve(handler);
