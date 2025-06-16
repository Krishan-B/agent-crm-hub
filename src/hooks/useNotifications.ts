
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'lead_assigned' | 'kyc_submitted' | 'balance_updated' | 'appointment_reminder' | 'communication_received' | 'system_alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  clicked: boolean;
  data?: any;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        setError(error.message);
        return;
      }

      // Type cast the data to ensure proper typing
      const typedNotifications = (notificationsData || []).map(notification => ({
        ...notification,
        type: notification.type as Notification['type'],
        priority: notification.priority as Notification['priority']
      }));

      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data: preferencesData, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('notification_type');

      if (error) {
        console.error('Error fetching preferences:', error);
        return;
      }

      setPreferences(preferencesData || []);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase.rpc('mark_all_notifications_read');

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      return result;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  const updatePreference = async (notificationType: string, updates: Partial<NotificationPreference>) => {
    if (!user) return;

    try {
      const { data: updatedPreference, error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('notification_type', notificationType)
        .select()
        .single();

      if (error) {
        console.error('Error updating preference:', error);
        throw error;
      }

      // Update local state
      setPreferences(prev => 
        prev.map(p => 
          p.notification_type === notificationType ? updatedPreference : p
        )
      );

      return updatedPreference;
    } catch (err) {
      console.error('Error updating preference:', err);
      throw err;
    }
  };

  const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string,
    priority: string = 'medium',
    notificationData?: any,
    relatedEntityType?: string,
    relatedEntityId?: string
  ) => {
    try {
      const { data: result, error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: priority,
        p_data: notificationData,
        p_related_entity_type: relatedEntityType,
        p_related_entity_id: relatedEntityId
      });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return result;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  };

  // Set up real-time subscriptions
  useRealTimeData({
    onNotificationsChange: fetchNotifications
  });

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [user]);

  return {
    notifications,
    preferences,
    isLoading,
    error,
    unreadCount,
    fetchNotifications,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    updatePreference,
    createNotification
  };
};
