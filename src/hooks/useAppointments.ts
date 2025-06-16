
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';

export interface Appointment {
  id: string;
  lead_id: string;
  agent_id: string;
  title: string;
  description?: string;
  appointment_type: 'call' | 'meeting' | 'demo' | 'follow_up' | 'kyc_review' | 'onboarding';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_url?: string;
  notes?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  agent?: {
    first_name: string;
    last_name: string;
  };
}

export interface AgentAvailability {
  id: string;
  agent_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AgentAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAppointments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          lead:leads!lead_id(
            first_name,
            last_name,
            email
          ),
          agent:profiles!agent_id(
            first_name,
            last_name
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        setError(error.message);
        return;
      }

      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('agent_availability')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching availability:', error);
        return;
      }

      setAvailability(data || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  };

  // Set up real-time subscriptions
  useRealTimeData({
    onAppointmentsChange: fetchAppointments
  });

  const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'lead' | 'agent'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      throw err;
    }
  };

  const updateAvailability = async (agentId: string, availabilityData: Omit<AgentAvailability, 'id' | 'agent_id' | 'created_at' | 'updated_at'>[]) => {
    if (!user) return;

    try {
      // Delete existing availability for the agent
      await supabase
        .from('agent_availability')
        .delete()
        .eq('agent_id', agentId);

      // Insert new availability
      const { error } = await supabase
        .from('agent_availability')
        .insert(
          availabilityData.map(slot => ({
            ...slot,
            agent_id: agentId
          }))
        );

      if (error) {
        console.error('Error updating availability:', error);
        throw error;
      }

      await fetchAvailability();
    } catch (err) {
      console.error('Error updating availability:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchAvailability();
  }, [user]);

  return { 
    appointments, 
    availability,
    isLoading, 
    error, 
    fetchAppointments,
    createAppointment, 
    updateAppointment,
    updateAvailability
  };
};
