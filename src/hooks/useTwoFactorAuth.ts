
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export const useTwoFactorAuth = () => {
  const [twoFactorSettings, setTwoFactorSettings] = useState<TwoFactorAuth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTwoFactorSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTwoFactorSettings(data || null);
    } catch (err) {
      console.error('Error fetching 2FA settings:', err);
      setError('Failed to fetch 2FA settings');
    }
  };

  const generateSecret = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-2fa-secret', {
        body: { userId: user?.id }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error generating 2FA secret:', err);
      setError('Failed to generate 2FA secret');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const enableTwoFactor = async (secret: string, token: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enable-2fa', {
        body: { userId: user.id, secret, token }
      });

      if (error) throw error;
      await fetchTwoFactorSettings();
      return data;
    } catch (err) {
      console.error('Error enabling 2FA:', err);
      setError('Failed to enable 2FA');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async (token: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('disable-2fa', {
        body: { userId: user.id, token }
      });

      if (error) throw error;
      await fetchTwoFactorSettings();
      return data;
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      setError('Failed to disable 2FA');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (token: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa', {
        body: { userId: user.id, token }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      setError('Failed to verify 2FA');
      throw err;
    }
  };

  useEffect(() => {
    fetchTwoFactorSettings();
  }, [user]);

  return {
    twoFactorSettings,
    isLoading,
    error,
    generateSecret,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,
    fetchTwoFactorSettings
  };
};
