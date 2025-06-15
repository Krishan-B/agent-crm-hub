
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  date_of_birth?: string;
  status: string;
  balance: number;
  bonus_amount: number;
  registration_date: string;
  last_contact?: string;
  assigned_agent_id?: string;
  kyc_status?: string;
  created_at: string;
  updated_at: string;
  assigned_agent?: {
    first_name: string;
    last_name: string;
  };
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLeads = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_agent:profiles!assigned_agent_id(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        setError(error.message);
        return;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Error adding lead:', error);
        throw error;
      }

      await fetchLeads(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding lead:', err);
      throw err;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }

      await fetchLeads(); // Refresh the list
    } catch (err) {
      console.error('Error updating lead:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  return { leads, isLoading, error, fetchLeads, addLead, updateLead };
};
