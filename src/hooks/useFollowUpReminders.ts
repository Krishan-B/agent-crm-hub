
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { FollowUpReminder } from '../types/workflow';

export const useFollowUpReminders = () => {
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createFollowUpReminder = async (reminderData: Omit<FollowUpReminder, 'id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .insert([{
          lead_id: reminderData.lead_id,
          assigned_to: reminderData.assigned_to,
          reminder_type: reminderData.reminder_type,
          title: reminderData.title,
          description: reminderData.description,
          due_date: reminderData.due_date,
          status: reminderData.status,
          priority: reminderData.priority,
          created_by: reminderData.created_by,
          completed_at: reminderData.completed_at
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchReminders();
      return data;
    } catch (err) {
      console.error('Error creating follow-up reminder:', err);
      throw err;
    }
  };

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follow_up_reminders')
        .select(`
          *,
          lead:leads(first_name, last_name, email),
          assigned_user:profiles!assigned_to(first_name, last_name)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Safely cast the database types to our TypeScript types
      const reminders = (data || []).map(reminder => ({
        ...reminder,
        reminder_type: reminder.reminder_type as FollowUpReminder['reminder_type'],
        status: reminder.status as FollowUpReminder['status'],
        priority: reminder.priority as FollowUpReminder['priority']
      }));
      
      setReminders(reminders);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to fetch reminders');
    }
  };

  const completeReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('follow_up_reminders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchReminders();
    } catch (err) {
      console.error('Error completing reminder:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  return {
    reminders,
    isLoading,
    error,
    createFollowUpReminder,
    completeReminder,
    fetchReminders
  };
};
