
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface EmailRequest {
  leadId: string;
  type: 'email' | 'sms' | 'call' | 'note';
  subject?: string;
  content: string;
  recipientEmail?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export const useEmailService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sendEmail = async (emailData: EmailRequest) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending email:', emailData);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Email service error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);
      return data;
    } catch (err) {
      console.error('Error sending email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    sendEmail
  };
};
