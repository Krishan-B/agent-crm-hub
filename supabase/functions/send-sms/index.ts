
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

    const { to, body, templateId, templateVariables } = await req.json();

    let messageBody = body;

    // Process template if provided
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!templateError && template) {
        messageBody = template.content;
        
        // Replace template variables
        if (templateVariables) {
          Object.entries(templateVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            messageBody = messageBody.replace(regex, value as string);
          });
        }
      }
    }

    // Here you would integrate with your SMS provider (Twilio, etc.)
    // For now, we'll simulate the SMS sending
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Send SMS via Twilio
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioPhoneNumber,
        Body: messageBody,
      }),
    });

    const twilioResponse = await response.json();

    if (!response.ok) {
      throw new Error(`Twilio error: ${twilioResponse.message}`);
    }

    // Store SMS record in database
    const { data: smsRecord, error: smsError } = await supabase
      .from('sms_messages')
      .insert([{
        to: to,
        from: twilioPhoneNumber,
        body: messageBody,
        status: 'sent',
        external_id: twilioResponse.sid,
        sent_at: new Date().toISOString(),
        created_by: user.id
      }])
      .select()
      .single();

    if (smsError) {
      console.error('Error creating SMS record:', smsError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: twilioResponse.sid,
      smsRecord
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
