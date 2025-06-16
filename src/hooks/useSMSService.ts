
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface SMSMessage {
  id: string;
  to_phone: string;
  from_phone: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  external_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export const useSMSService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sendSMS = async (to: string, body: string, templateId?: string, templateVariables?: Record<string, string>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to,
          body,
          templateId,
          templateVariables
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error sending SMS:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkSMS = async (recipients: string[], body: string, templateId?: string, templateVariables?: Record<string, string>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-sms', {
        body: {
          recipients,
          body,
          templateId,
          templateVariables
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error sending bulk SMS:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send bulk SMS';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getSMSStatus = async (messageId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-sms-status', {
        body: { messageId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting SMS status:', err);
      throw err;
    }
  };

  return {
    isLoading,
    error,
    sendSMS,
    sendBulkSMS,
    getSMSStatus
  };
};
