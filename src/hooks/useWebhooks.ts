
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  headers?: Record<string, string>;
  retry_count: number;
  timeout: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  delivered_at?: string;
  created_at: string;
}

export const useWebhooks = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWebhooks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError('Failed to fetch webhooks');
    }
  };

  const createWebhook = async (webhookData: Omit<Webhook, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert([{
          ...webhookData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchWebhooks();
      return data;
    } catch (err) {
      console.error('Error creating webhook:', err);
      setError('Failed to create webhook');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Webhook>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchWebhooks();
    } catch (err) {
      console.error('Error updating webhook:', err);
      setError('Failed to update webhook');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchWebhooks();
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Failed to delete webhook');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const triggerWebhook = async (webhookId: string, eventType: string, payload: any) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-webhook', {
        body: {
          webhookId,
          eventType,
          payload
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error triggering webhook:', err);
      setError('Failed to trigger webhook');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhookLogs = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
      setError('Failed to fetch webhook logs');
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [user]);

  return {
    webhooks,
    logs,
    isLoading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    triggerWebhook,
    fetchWebhookLogs
  };
};
