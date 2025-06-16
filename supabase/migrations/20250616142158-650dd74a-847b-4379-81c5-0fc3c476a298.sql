
-- Create audit_logs table for comprehensive audit logging
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rate_limits table for rate limiting
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- login, api_call, etc.
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create two_factor_auth table for 2FA
CREATE TABLE public.two_factor_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create encrypted_data table for sensitive field encryption
CREATE TABLE public.encrypted_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  encryption_key_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_name, record_id, field_name)
);

-- Enable RLS on new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (admins only)
CREATE POLICY "Admins can view all audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS policies for rate_limits (system use only)
CREATE POLICY "System can manage rate limits" 
  ON public.rate_limits 
  FOR ALL 
  USING (true);

-- RLS policies for two_factor_auth
CREATE POLICY "Users can view their own 2FA settings" 
  ON public.two_factor_auth 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" 
  ON public.two_factor_auth 
  FOR ALL 
  USING (auth.uid() = user_id);

-- RLS policies for encrypted_data (system use only)
CREATE POLICY "System can manage encrypted data" 
  ON public.encrypted_data 
  FOR ALL 
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX idx_rate_limits_action ON public.rate_limits(action);
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX idx_encrypted_data_lookup ON public.encrypted_data(table_name, record_id, field_name);

-- Create function for audit logging
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values,
    ip_address, user_agent, session_id
  ) VALUES (
    p_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values,
    p_ip_address, p_user_agent, p_session_id
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Create function for rate limiting check
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
  is_blocked BOOLEAN DEFAULT FALSE;
BEGIN
  window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if currently blocked
  SELECT EXISTS(
    SELECT 1 FROM public.rate_limits 
    WHERE identifier = p_identifier 
    AND action = p_action 
    AND blocked_until > now()
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Get current count in window
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM public.rate_limits 
  WHERE identifier = p_identifier 
  AND action = p_action 
  AND window_start >= window_start;
  
  -- Update or insert rate limit record
  INSERT INTO public.rate_limits (identifier, action, count, window_start)
  VALUES (p_identifier, p_action, 1, now())
  ON CONFLICT (identifier, action) 
  DO UPDATE SET 
    count = CASE 
      WHEN rate_limits.window_start < window_start THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start THEN now()
      ELSE rate_limits.window_start
    END,
    blocked_until = CASE 
      WHEN (CASE 
        WHEN rate_limits.window_start < window_start THEN 1
        ELSE rate_limits.count + 1
      END) > p_limit THEN now() + INTERVAL '1 hour'
      ELSE NULL
    END,
    updated_at = now();
  
  RETURN current_count < p_limit;
END;
$$;
