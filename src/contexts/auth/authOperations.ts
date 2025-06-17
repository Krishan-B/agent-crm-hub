
import { supabase } from '@/integrations/supabase/client';
import { logSession } from '../../utils/sessionLogger';
import { checkRateLimit, createAuditLog } from './utils';

export const performLogin = async (email: string, password: string) => {
  try {
    await checkRateLimit(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Log failed login attempt
      await createAuditLog(null, 'login_failed', { email, error: error.message }, navigator.userAgent);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unexpected error occurred' };
  }
};

export const performSignUp = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  role: 'admin' | 'agent'
) => {
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      }
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
};

export const performLogout = async (userId: string) => {
  await logSession(userId, 'logout');
  await createAuditLog(userId, 'logout', null, navigator.userAgent);
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
};
