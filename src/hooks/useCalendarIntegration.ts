
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  source: 'google' | 'outlook' | 'internal';
}

export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: 'google' | 'outlook';
  access_token: string;
  refresh_token?: string;
  calendar_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCalendarIntegration = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchIntegrations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (err) {
      console.error('Error fetching calendar integrations:', err);
      setError('Failed to fetch calendar integrations');
    }
  };

  const connectGoogleCalendar = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'connect' }
      });

      if (error) throw error;
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Error connecting Google Calendar:', err);
      setError('Failed to connect Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const connectOutlookCalendar = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('outlook-calendar-auth', {
        body: { action: 'connect' }
      });

      if (error) throw error;
      
      // Redirect to Microsoft OAuth
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Error connecting Outlook Calendar:', err);
      setError('Failed to connect Outlook Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const syncCalendarEvents = async (integrationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { integrationId }
      });

      if (error) throw error;
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error syncing calendar events:', err);
      setError('Failed to sync calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const createCalendarEvent = async (eventData: Omit<CalendarEvent, 'id' | 'source'>, integrationId?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: { eventData, integrationId }
      });

      if (error) throw error;
      return data.event;
    } catch (err) {
      console.error('Error creating calendar event:', err);
      setError('Failed to create calendar event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  return {
    integrations,
    events,
    isLoading,
    error,
    connectGoogleCalendar,
    connectOutlookCalendar,
    syncCalendarEvents,
    createCalendarEvent,
    fetchIntegrations
  };
};
