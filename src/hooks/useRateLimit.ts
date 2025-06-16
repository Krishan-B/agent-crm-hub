
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRateLimit = async (
    identifier: string,
    action: string,
    limit: number = 10,
    windowMinutes: number = 15
  ): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action: action,
        p_limit: limit,
        p_window_minutes: windowMinutes
      });

      if (error) throw error;
      return data as boolean;
    } catch (err) {
      console.error('Error checking rate limit:', err);
      setError('Failed to check rate limit');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    error,
    checkRateLimit
  };
};
