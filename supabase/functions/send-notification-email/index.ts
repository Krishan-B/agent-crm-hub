
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  userId: string;
  notificationType: string;
  data: any;
}

const serve = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, notificationType, data }: NotificationEmailRequest = await req.json();
    
    console.log('Processing notification email:', { userId, notificationType, data });

    // Get user profile and email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('User profile not found');
    }

    // Get user email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      throw new Error('User not found');
    }

    // Check notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .single();

    if (preferencesError || !preferences?.email_enabled) {
      console.log('Email notifications disabled for this type:', notificationType);
      return new Response(JSON.stringify({ message: 'Email notifications disabled' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate email content based on notification type
    const emailContent = generateEmailContent(notificationType, data, profile);
    
    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Plexop CRM <notifications@plexop.com>",
      to: [user.email!],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function generateEmailContent(notificationType: string, data: any, profile: any) {
  const firstName = profile.first_name;
  
  switch (notificationType) {
    case 'lead_assigned':
      return {
        subject: 'New Lead Assigned - Plexop CRM',
        html: `
          <h2>New Lead Assigned</h2>
          <p>Hi ${firstName},</p>
          <p>You have been assigned a new lead: <strong>${data.leadName}</strong></p>
          <p>Please review the lead details and take appropriate action.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/leads/${data.leadId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Lead</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };
    
    case 'kyc_submitted':
      return {
        subject: 'KYC Documents Submitted - Plexop CRM',
        html: `
          <h2>KYC Documents Submitted</h2>
          <p>Hi ${firstName},</p>
          <p><strong>${data.leadName}</strong> has submitted KYC documents for review.</p>
          <p>Please review the documents and update the KYC status accordingly.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/leads/${data.leadId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review KYC</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };

    case 'balance_updated':
      return {
        subject: 'Balance Updated - Plexop CRM',
        html: `
          <h2>Balance Updated</h2>
          <p>Hi ${firstName},</p>
          <p><strong>${data.leadName}</strong>'s balance has been updated to <strong>$${data.newBalance.toLocaleString()}</strong>.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/leads/${data.leadId}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Lead</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };

    case 'appointment_reminder':
      return {
        subject: 'Appointment Reminder - Plexop CRM',
        html: `
          <h2>Appointment Reminder</h2>
          <p>Hi ${firstName},</p>
          <p>You have an upcoming appointment: <strong>${data.appointmentTitle}</strong></p>
          <p>Scheduled for: <strong>${new Date(data.scheduledAt).toLocaleString()}</strong></p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/calendar" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Calendar</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };

    case 'communication_received':
      return {
        subject: 'New Communication - Plexop CRM',
        html: `
          <h2>New Communication</h2>
          <p>Hi ${firstName},</p>
          <p>You have received a new message from <strong>${data.senderName}</strong>.</p>
          <p>Subject: <strong>${data.subject}</strong></p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/communications" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Message</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };

    case 'system_alert':
      return {
        subject: `System Alert: ${data.title} - Plexop CRM`,
        html: `
          <h2>${data.title}</h2>
          <p>Hi ${firstName},</p>
          <p>${data.message}</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/dashboard" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };

    default:
      return {
        subject: 'Notification - Plexop CRM',
        html: `
          <h2>Notification</h2>
          <p>Hi ${firstName},</p>
          <p>You have a new notification in your Plexop CRM account.</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/dashboard" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
          <p>Best regards,<br>Plexop CRM Team</p>
        `
      };
  }
}

serve(serve);
