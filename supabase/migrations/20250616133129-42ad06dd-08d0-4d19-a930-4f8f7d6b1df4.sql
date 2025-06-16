
-- Create calendar_integrations table
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  calendar_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  headers JSONB DEFAULT '{}',
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout INTEGER NOT NULL DEFAULT 30,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook_logs table  
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sms_messages table
CREATE TABLE public.sms_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_phone TEXT NOT NULL,
  from_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calendar_integrations
CREATE POLICY "Users can view their own calendar integrations" 
  ON public.calendar_integrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar integrations" 
  ON public.calendar_integrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations" 
  ON public.calendar_integrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations" 
  ON public.calendar_integrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for webhooks
CREATE POLICY "Users can view all webhooks" 
  ON public.webhooks 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create webhooks" 
  ON public.webhooks 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own webhooks" 
  ON public.webhooks 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own webhooks" 
  ON public.webhooks 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Create RLS policies for webhook_logs
CREATE POLICY "Users can view webhook logs for their webhooks" 
  ON public.webhook_logs 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.webhooks 
    WHERE webhooks.id = webhook_logs.webhook_id 
    AND webhooks.created_by = auth.uid()
  ));

-- Create RLS policies for sms_messages
CREATE POLICY "Users can view their own SMS messages" 
  ON public.sms_messages 
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create SMS messages" 
  ON public.sms_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX idx_calendar_integrations_user_id ON public.calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON public.calendar_integrations(provider);
CREATE INDEX idx_webhooks_created_by ON public.webhooks(created_by);
CREATE INDEX idx_webhooks_is_active ON public.webhooks(is_active);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_sms_messages_created_by ON public.sms_messages(created_by);
CREATE INDEX idx_sms_messages_status ON public.sms_messages(status);
