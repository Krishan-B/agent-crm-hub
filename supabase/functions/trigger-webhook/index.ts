
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { webhookId, eventType, payload } = await req.json();

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found or inactive');
    }

    // Check if webhook is configured for this event type
    if (!webhook.events.includes(eventType)) {
      throw new Error('Webhook not configured for this event type');
    }

    // Prepare webhook payload
    const webhookPayload = {
      event: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
      webhook_id: webhookId
    };

    // Generate signature for webhook security
    const signature = await generateSignature(JSON.stringify(webhookPayload), webhook.secret);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'User-Agent': 'Plexop-CRM-Webhook/1.0',
      ...webhook.headers
    };

    // Send webhook with retry logic
    let lastError: Error | null = null;
    let responseStatus: number | undefined;
    let responseBody: string | undefined;

    for (let attempt = 0; attempt <= webhook.retry_count; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        responseStatus = response.status;
        responseBody = await response.text();

        if (response.ok) {
          // Success - log and break
          await logWebhook(webhook.id, eventType, webhookPayload, responseStatus, responseBody);
          
          return new Response(JSON.stringify({ 
            success: true, 
            status: responseStatus,
            attempts: attempt + 1
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } else {
          lastError = new Error(`HTTP ${responseStatus}: ${responseBody}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < webhook.retry_count) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All attempts failed - log the failure
    await logWebhook(webhook.id, eventType, webhookPayload, responseStatus, responseBody, lastError?.message);

    return new Response(JSON.stringify({ 
      success: false, 
      error: lastError?.message || 'Webhook delivery failed',
      attempts: webhook.retry_count + 1
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in trigger-webhook function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hashHex}`;
}

async function logWebhook(
  webhookId: string, 
  eventType: string, 
  payload: any, 
  responseStatus?: number, 
  responseBody?: string, 
  errorMessage?: string
) {
  try {
    await supabase
      .from('webhook_logs')
      .insert([{
        webhook_id: webhookId,
        event_type: eventType,
        payload: payload,
        response_status: responseStatus,
        response_body: responseBody,
        error_message: errorMessage,
        delivered_at: errorMessage ? null : new Date().toISOString()
      }]);
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

serve(handler);
