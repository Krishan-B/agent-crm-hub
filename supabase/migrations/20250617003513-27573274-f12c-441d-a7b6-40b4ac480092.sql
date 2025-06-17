
-- Fix the ambiguous column reference in check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_limit integer DEFAULT 10,
  p_window_minutes integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
  is_blocked BOOLEAN DEFAULT FALSE;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
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
  AND public.rate_limits.window_start >= window_start_time;
  
  -- Update or insert rate limit record
  INSERT INTO public.rate_limits (identifier, action, count, window_start)
  VALUES (p_identifier, p_action, 1, now())
  ON CONFLICT (identifier, action) 
  DO UPDATE SET 
    count = CASE 
      WHEN public.rate_limits.window_start < window_start_time THEN 1
      ELSE public.rate_limits.count + 1
    END,
    window_start = CASE 
      WHEN public.rate_limits.window_start < window_start_time THEN now()
      ELSE public.rate_limits.window_start
    END,
    blocked_until = CASE 
      WHEN (CASE 
        WHEN public.rate_limits.window_start < window_start_time THEN 1
        ELSE public.rate_limits.count + 1
      END) > p_limit THEN now() + INTERVAL '1 hour'
      ELSE NULL
    END,
    updated_at = now();
  
  RETURN current_count < p_limit;
END;
$$;

-- Also add a unique constraint to prevent conflicts
ALTER TABLE public.rate_limits 
DROP CONSTRAINT IF EXISTS rate_limits_identifier_action_key;

ALTER TABLE public.rate_limits 
ADD CONSTRAINT rate_limits_identifier_action_key 
UNIQUE (identifier, action);
