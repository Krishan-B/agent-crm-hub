
-- Create enum for appointment types
CREATE TYPE public.appointment_type AS ENUM ('call', 'meeting', 'demo', 'follow_up', 'kyc_review', 'onboarding');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled');

-- Create appointments table for calendar functionality
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  appointment_type public.appointment_type NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT, -- Can be physical address, zoom link, phone number, etc.
  meeting_url TEXT, -- For virtual meetings
  notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead scoring table for AI-powered analytics
CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_factors JSONB, -- Store detailed scoring breakdown
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  calculated_by TEXT DEFAULT 'ai_system', -- Who/what calculated the score
  version TEXT DEFAULT '1.0' -- Score algorithm version
);

-- Create analytics snapshots table for historical data
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  total_leads INTEGER NOT NULL DEFAULT 0,
  new_leads_today INTEGER NOT NULL DEFAULT 0,
  active_leads INTEGER NOT NULL DEFAULT 0,
  converted_leads INTEGER NOT NULL DEFAULT 0,
  total_deposits NUMERIC(15,2) NOT NULL DEFAULT 0,
  average_deposit NUMERIC(15,2) NOT NULL DEFAULT 0,
  kyc_pending INTEGER NOT NULL DEFAULT 0,
  kyc_approved INTEGER NOT NULL DEFAULT 0,
  kyc_rejected INTEGER NOT NULL DEFAULT 0,
  activities_count INTEGER NOT NULL DEFAULT 0,
  communications_sent INTEGER NOT NULL DEFAULT 0,
  appointments_scheduled INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  metadata JSONB, -- Store additional analytics data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date)
);

-- Create calendar availability table for agents
CREATE TABLE public.agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, day_of_week, start_time)
);

-- Add indexes for better performance
CREATE INDEX idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX idx_appointments_agent_id ON public.appointments(agent_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_type ON public.appointments(appointment_type);
CREATE INDEX idx_lead_scores_lead_id ON public.lead_scores(lead_id);
CREATE INDEX idx_lead_scores_calculated_at ON public.lead_scores(calculated_at);
CREATE INDEX idx_analytics_snapshots_date ON public.analytics_snapshots(snapshot_date);
CREATE INDEX idx_agent_availability_agent_id ON public.agent_availability(agent_id);

-- Enable RLS on new tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for appointments
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can manage their own appointments" ON public.appointments FOR ALL USING (agent_id = auth.uid());
CREATE POLICY "Agents can view appointments for their leads" ON public.appointments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);

-- RLS policies for lead_scores
CREATE POLICY "Admins can view all lead scores" ON public.lead_scores FOR SELECT USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can view scores for their leads" ON public.lead_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);
CREATE POLICY "System can insert lead scores" ON public.lead_scores FOR INSERT WITH CHECK (true);

-- RLS policies for analytics_snapshots
CREATE POLICY "Admins can manage analytics snapshots" ON public.analytics_snapshots FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can view analytics snapshots" ON public.analytics_snapshots FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for agent_availability
CREATE POLICY "Admins can manage all availability" ON public.agent_availability FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can manage their own availability" ON public.agent_availability FOR ALL USING (agent_id = auth.uid());
CREATE POLICY "All authenticated users can view availability" ON public.agent_availability FOR SELECT USING (auth.role() = 'authenticated');

-- Function to calculate daily analytics snapshot
CREATE OR REPLACE FUNCTION public.generate_daily_analytics_snapshot(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_leads_count INTEGER;
  new_leads_count INTEGER;
  active_leads_count INTEGER;
  converted_leads_count INTEGER;
  total_deposits_sum NUMERIC;
  avg_deposit NUMERIC;
  kyc_pending_count INTEGER;
  kyc_approved_count INTEGER;
  kyc_rejected_count INTEGER;
  activities_count INTEGER;
  communications_count INTEGER;
  appointments_count INTEGER;
  conversion_rate NUMERIC;
BEGIN
  -- Calculate metrics
  SELECT COUNT(*) INTO total_leads_count FROM public.leads WHERE DATE(created_at) <= target_date;
  SELECT COUNT(*) INTO new_leads_count FROM public.leads WHERE DATE(created_at) = target_date;
  SELECT COUNT(*) INTO active_leads_count FROM public.leads WHERE status = 'active' AND DATE(created_at) <= target_date;
  SELECT COUNT(*) INTO converted_leads_count FROM public.leads WHERE balance > 0 AND DATE(created_at) <= target_date;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_deposits_sum 
  FROM public.transactions 
  WHERE type = 'deposit' AND DATE(created_at) <= target_date;
  
  SELECT CASE WHEN converted_leads_count > 0 THEN total_deposits_sum / converted_leads_count ELSE 0 END INTO avg_deposit;
  
  SELECT COUNT(*) INTO kyc_pending_count FROM public.leads WHERE kyc_status = 'pending' AND DATE(created_at) <= target_date;
  SELECT COUNT(*) INTO kyc_approved_count FROM public.leads WHERE kyc_status = 'approved' AND DATE(created_at) <= target_date;
  SELECT COUNT(*) INTO kyc_rejected_count FROM public.leads WHERE kyc_status = 'rejected' AND DATE(created_at) <= target_date;
  
  SELECT COUNT(*) INTO activities_count FROM public.lead_activities WHERE DATE(created_at) = target_date;
  SELECT COUNT(*) INTO communications_count FROM public.communications WHERE DATE(created_at) = target_date;
  SELECT COUNT(*) INTO appointments_count FROM public.appointments WHERE DATE(created_at) = target_date;
  
  SELECT CASE WHEN total_leads_count > 0 THEN (converted_leads_count::NUMERIC / total_leads_count) * 100 ELSE 0 END INTO conversion_rate;
  
  -- Insert or update snapshot
  INSERT INTO public.analytics_snapshots (
    snapshot_date, total_leads, new_leads_today, active_leads, converted_leads,
    total_deposits, average_deposit, kyc_pending, kyc_approved, kyc_rejected,
    activities_count, communications_sent, appointments_scheduled, conversion_rate
  ) VALUES (
    target_date, total_leads_count, new_leads_count, active_leads_count, converted_leads_count,
    total_deposits_sum, avg_deposit, kyc_pending_count, kyc_approved_count, kyc_rejected_count,
    activities_count, communications_count, appointments_count, conversion_rate
  )
  ON CONFLICT (snapshot_date) 
  DO UPDATE SET
    total_leads = EXCLUDED.total_leads,
    new_leads_today = EXCLUDED.new_leads_today,
    active_leads = EXCLUDED.active_leads,
    converted_leads = EXCLUDED.converted_leads,
    total_deposits = EXCLUDED.total_deposits,
    average_deposit = EXCLUDED.average_deposit,
    kyc_pending = EXCLUDED.kyc_pending,
    kyc_approved = EXCLUDED.kyc_approved,
    kyc_rejected = EXCLUDED.kyc_rejected,
    activities_count = EXCLUDED.activities_count,
    communications_sent = EXCLUDED.communications_sent,
    appointments_scheduled = EXCLUDED.appointments_scheduled,
    conversion_rate = EXCLUDED.conversion_rate,
    created_at = now();
END;
$$;

-- Generate initial snapshot for today
SELECT public.generate_daily_analytics_snapshot();

-- Add some default agent availability (9 AM to 5 PM, Monday to Friday)
INSERT INTO public.agent_availability (agent_id, day_of_week, start_time, end_time, timezone)
SELECT 
  p.id,
  day_num,
  '09:00:00'::TIME,
  '17:00:00'::TIME,
  'UTC'
FROM public.profiles p
CROSS JOIN generate_series(1, 5) AS day_num
WHERE p.role IN ('agent', 'admin')
ON CONFLICT (agent_id, day_of_week, start_time) DO NOTHING;
