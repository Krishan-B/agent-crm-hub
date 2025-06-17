
import { supabase } from '@/integrations/supabase/client';

export const clearRateLimitBlock = async (identifier: string, action: string = 'login') => {
  try {
    const { error } = await supabase
      .from('rate_limits')
      .update({ 
        blocked_until: null,
        count: 0,
        window_start: new Date().toISOString()
      })
      .eq('identifier', identifier)
      .eq('action', action);

    if (error) {
      console.error('Error clearing rate limit:', error);
      return false;
    }
    
    console.log('Rate limit cleared for:', identifier);
    return true;
  } catch (err) {
    console.error('Failed to clear rate limit:', err);
    return false;
  }
};

export const checkRateLimitStatus = async (identifier: string, action: string = 'login') => {
  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking rate limit status:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to check rate limit status:', err);
    return null;
  }
};
