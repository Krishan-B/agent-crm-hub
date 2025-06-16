
-- Create enum for communication types
CREATE TYPE public.communication_type AS ENUM ('email', 'sms', 'call', 'meeting', 'note');

-- Create enum for communication status
CREATE TYPE public.communication_status AS ENUM ('sent', 'delivered', 'failed', 'pending', 'read');

-- Create communications table for tracking all outbound communications
CREATE TABLE public.communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type public.communication_type NOT NULL,
  subject TEXT,
  content TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  status public.communication_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id TEXT, -- For tracking with external services like SendGrid/Twilio
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication templates table
CREATE TABLE public.communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.communication_type NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB, -- Store template variables like {first_name}, {balance}
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead tags table for better categorization
CREATE TABLE public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for lead-tag relationships
CREATE TABLE public.lead_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Add indexes for better performance
CREATE INDEX idx_communications_lead_id ON public.communications(lead_id);
CREATE INDEX idx_communications_type ON public.communications(type);
CREATE INDEX idx_communications_status ON public.communications(status);
CREATE INDEX idx_communications_created_at ON public.communications(created_at);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_activity_type ON public.lead_activities(activity_type);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_kyc_status ON public.leads(kyc_status);
CREATE INDEX idx_leads_country ON public.leads(country);
CREATE INDEX idx_leads_assigned_agent_id ON public.leads(assigned_agent_id);

-- Add full-text search capabilities
ALTER TABLE public.leads ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_lead_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
                       setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
                       setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
                       setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'B') ||
                       setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_lead_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_search_vector();

-- Update existing leads with search vectors
UPDATE public.leads SET updated_at = now();

-- Create GIN index for full-text search
CREATE INDEX idx_leads_search_vector ON public.leads USING gin(search_vector);

-- Enable RLS on new tables
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for communications
CREATE POLICY "Admins can manage all communications" ON public.communications FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can manage communications for their leads" ON public.communications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);

-- RLS policies for communication_templates
CREATE POLICY "All authenticated users can view templates" ON public.communication_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage templates" ON public.communication_templates FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS policies for lead_tags
CREATE POLICY "All authenticated users can view tags" ON public.lead_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage tags" ON public.lead_tags FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS policies for lead_tag_assignments
CREATE POLICY "Admins can manage all tag assignments" ON public.lead_tag_assignments FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can manage tag assignments for their leads" ON public.lead_tag_assignments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);

-- Add some default communication templates
INSERT INTO public.communication_templates (name, type, subject, content, variables) VALUES
('Welcome Email', 'email', 'Welcome to CFD Trading, {first_name}!', 'Dear {first_name} {last_name},\n\nWelcome to our CFD trading platform! We''re excited to have you on board.\n\nYour account is now set up and ready to use. If you have any questions, please don''t hesitate to contact us.\n\nBest regards,\nThe CFD Trading Team', '["first_name", "last_name"]'),
('KYC Reminder', 'email', 'KYC Verification Required', 'Dear {first_name},\n\nWe notice that your KYC verification is still pending. Please upload your required documents to complete the verification process.\n\nOnce verified, you''ll have full access to all trading features.\n\nBest regards,\nCompliance Team', '["first_name"]'),
('Follow-up Call', 'call', 'Follow-up Call', 'Schedule follow-up call with {first_name} {last_name} regarding their account status and trading activity.', '["first_name", "last_name"]'),
('SMS Welcome', 'sms', '', 'Hi {first_name}! Welcome to CFD Trading. Your account is ready. Questions? Reply HELP for support.', '["first_name"]');

-- Add some default tags
INSERT INTO public.lead_tags (name, color) VALUES
('High Value', '#10B981'),
('VIP', '#F59E0B'),
('Risk Alert', '#EF4444'),
('Follow Up Required', '#8B5CF6'),
('New Client', '#3B82F6'),
('Inactive', '#6B7280');
