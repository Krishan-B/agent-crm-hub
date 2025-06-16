
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { supabase } from "../_shared/supabase.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  leadId: string;
  type: 'email' | 'sms' | 'call' | 'note';
  subject?: string;
  content: string;
  recipientEmail?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      leadId, 
      type, 
      subject, 
      content, 
      recipientEmail,
      templateId,
      templateVariables = {}
    }: EmailRequest = await req.json();

    let emailContent = content;
    let emailSubject = subject;

    // If using a template, fetch and process it
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!templateError && template) {
        emailContent = template.content;
        emailSubject = template.subject || subject;

        // Replace template variables
        Object.entries(templateVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{${key}}`, 'g');
          emailContent = emailContent.replace(regex, value);
          if (emailSubject) {
            emailSubject = emailSubject.replace(regex, value);
          }
        });
      }
    }

    // Send email only if type is email and recipientEmail is provided
    let emailResponse = null;
    if (type === 'email' && recipientEmail) {
      emailResponse = await resend.emails.send({
        from: "Lead Management <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: emailSubject || 'Communication from Lead Management',
        html: emailContent,
      });

      if (emailResponse.error) {
        throw new Error(`Email sending failed: ${emailResponse.error.message}`);
      }
    }

    // Create communication record
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .insert([{
        lead_id: leadId,
        type: type,
        subject: emailSubject,
        content: emailContent,
        recipient_email: recipientEmail,
        status: type === 'email' ? 'sent' : 'delivered',
        sent_at: new Date().toISOString(),
        external_id: emailResponse?.data?.id || null,
        created_by: user.id
      }])
      .select()
      .single();

    if (commError) {
      console.error('Error creating communication record:', commError);
      throw commError;
    }

    console.log('Communication sent successfully:', communication);

    return new Response(JSON.stringify({ 
      success: true, 
      communication,
      emailId: emailResponse?.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
