
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';

export interface Communication {
  id: string;
  lead_id: string;
  type: 'email' | 'sms' | 'call' | 'meeting' | 'note';
  subject?: string;
  content?: string;
  recipient_email?: string;
  recipient_phone?: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending' | 'read';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  external_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'call' | 'meeting' | 'note';
  subject?: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useCommunications = (leadId?: string) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCommunications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('communications')
        .select(`
          *,
          creator:profiles!created_by(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching communications:', error);
        setError(error.message);
        return;
      }

      setCommunications(data || []);
    } catch (err) {
      console.error('Error fetching communications:', err);
      setError('Failed to fetch communications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching templates:', error);
        return;
      }

      // Transform the data to match our interface, properly handling the variables field
      const transformedTemplates: CommunicationTemplate[] = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : 
                  typeof template.variables === 'string' ? JSON.parse(template.variables) :
                  []
      }));

      setTemplates(transformedTemplates);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  // Set up real-time subscriptions
  useRealTimeData({
    onCommunicationsChange: fetchCommunications
  });

  const sendCommunication = async (communicationData: Omit<Communication, 'id' | 'created_at' | 'updated_at' | 'creator'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('communications')
        .insert([{
          ...communicationData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending communication:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error sending communication:', err);
      throw err;
    }
  };

  const updateCommunicationStatus = async (id: string, status: Communication['status'], metadata?: { sent_at?: string; delivered_at?: string; read_at?: string; error_message?: string }) => {
    if (!user) return;

    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };

      if (metadata) {
        Object.assign(updateData, metadata);
      }

      const { error } = await supabase
        .from('communications')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating communication status:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error updating communication status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchCommunications();
    fetchTemplates();
  }, [user, leadId]);

  return { 
    communications, 
    templates, 
    isLoading, 
    error, 
    fetchCommunications, 
    sendCommunication, 
    updateCommunicationStatus 
  };
};
