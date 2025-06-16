
-- Create scheduled_reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL,
  frequency TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_run TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_reports
CREATE POLICY "Users can view scheduled reports" 
  ON public.scheduled_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create scheduled reports" 
  ON public.scheduled_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update scheduled reports" 
  ON public.scheduled_reports 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete scheduled reports" 
  ON public.scheduled_reports 
  FOR DELETE 
  USING (auth.uid() = created_by);
