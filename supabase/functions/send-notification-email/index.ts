
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  type: 'reminder' | 'escalation' | 'system' | 'marketing';
  content: string;
  leadId?: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, content, leadId, userId }: NotificationEmailRequest = await req.json();

    console.log(`Sending ${type} notification email to ${to}`);

    // Get email template based on type
    const emailContent = getEmailTemplate(type, content, subject);

    const emailResponse = await resend.emails.send({
      from: "Plexop CRM <notifications@resend.dev>",
      to: [to],
      subject: subject,
      html: emailContent,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      message: "Notification email sent successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function getEmailTemplate(type: string, content: string, subject: string): string {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  `;

  switch (type) {
    case 'reminder':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>📅 Reminder</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${content}</p>
            <a href="#" class="button">View in CRM</a>
          </div>
          <div class="footer">
            <p>This is an automated reminder from Plexop CRM</p>
          </div>
        </div>
      `;
    
    case 'escalation':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
            <h1>🚨 Escalation Alert</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p><strong>Action Required:</strong></p>
            <p>${content}</p>
            <a href="#" class="button" style="background: #ee5a24;">Take Action</a>
          </div>
          <div class="footer">
            <p>This is an automated escalation from Plexop CRM</p>
          </div>
        </div>
      `;
    
    case 'system':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #4834d4 0%, #686de0 100%);">
            <h1>⚙️ System Notification</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${content}</p>
          </div>
          <div class="footer">
            <p>This is a system notification from Plexop CRM</p>
          </div>
        </div>
      `;
    
    default:
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>💬 Notification</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${content}</p>
          </div>
          <div class="footer">
            <p>This is a notification from Plexop CRM</p>
          </div>
        </div>
      `;
  }
}

serve(handler);
