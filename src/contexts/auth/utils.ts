
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from './types';

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (data) {
      // Ensure role and status are properly typed
      return {
        ...data,
        role: data.role as 'admin' | 'agent',
        status: data.status as 'active' | 'inactive'
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
};

export const checkRateLimit = async (email: string) => {
  const { data: canAttemptLogin, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
    p_identifier: email,
    p_action: 'login',
    p_limit: 5,
    p_window_minutes: 15
  });

  if (rateLimitError) {
    console.error('Rate limit check error:', rateLimitError);
    throw new Error('Unable to process login request. Please try again.');
  }

  if (!canAttemptLogin) {
    throw new Error('Too many login attempts. Please try again in 15 minutes.');
  }
};

export const createAuditLog = async (userId: string | null, action: string, newValues?: any, userAgent?: string) => {
  await supabase.rpc('create_audit_log', {
    p_user_id: userId,
    p_action: action,
    p_new_values: newValues,
    p_ip_address: null,
    p_user_agent: userAgent
  });
};
