
-- Create workflow automation tables
CREATE TABLE public.workflow_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lead_assignment', 'email_automation', 'follow_up', 'escalation')),
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow executions table
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.workflow_rules NOT NULL,
  lead_id UUID REFERENCES public.leads NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result_data JSONB
);

-- Create follow-up reminders table
CREATE TABLE public.follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads NOT NULL,
  assigned_to UUID REFERENCES auth.users NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('call', 'email', 'meeting', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create escalation rules table
CREATE TABLE public.escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  escalation_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow_rules
CREATE POLICY "Users can view workflow rules" ON public.workflow_rules FOR SELECT USING (true);
CREATE POLICY "Users can create workflow rules" ON public.workflow_rules FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their workflow rules" ON public.workflow_rules FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their workflow rules" ON public.workflow_rules FOR DELETE USING (auth.uid() = created_by);

-- Create policies for workflow_executions
CREATE POLICY "Users can view workflow executions" ON public.workflow_executions FOR SELECT USING (true);
CREATE POLICY "Users can create workflow executions" ON public.workflow_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update workflow executions" ON public.workflow_executions FOR UPDATE USING (true);

-- Create policies for follow_up_reminders
CREATE POLICY "Users can view follow-up reminders" ON public.follow_up_reminders FOR SELECT USING (true);
CREATE POLICY "Users can create follow-up reminders" ON public.follow_up_reminders FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update follow-up reminders" ON public.follow_up_reminders FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
CREATE POLICY "Users can delete follow-up reminders" ON public.follow_up_reminders FOR DELETE USING (auth.uid() = created_by);

-- Create policies for escalation_rules
CREATE POLICY "Users can view escalation rules" ON public.escalation_rules FOR SELECT USING (true);
CREATE POLICY "Users can create escalation rules" ON public.escalation_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update escalation rules" ON public.escalation_rules FOR UPDATE USING (true);
CREATE POLICY "Users can delete escalation rules" ON public.escalation_rules FOR DELETE USING (true);
