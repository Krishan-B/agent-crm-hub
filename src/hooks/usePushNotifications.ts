
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  created_at: string;
  last_used_at: string;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        // Check if subscription exists in database
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('endpoint', pushSubscription.endpoint)
          .single();

        if (!error && data) {
          setIsSubscribed(true);
          setSubscription(data);
        }
      }
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const subscribe = async () => {
    if (!user || !isSupported) {
      throw new Error('Push notifications not supported or user not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // You'll need to generate VAPID keys and store the public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI-8l6iWLKfgLFOHhNEgw-mEuR-L9eTbPp6Uq5V2bLH2H7GfOaJNS5F8A'
        )
      });

      // Save subscription to database
      const subscriptionData = {
        user_id: user.id,
        endpoint: pushSubscription.endpoint,
        p256dh_key: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
        auth_key: arrayBufferToBase64(pushSubscription.getKey('auth')!),
        user_agent: navigator.userAgent
      };

      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) {
        console.error('Error saving push subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      setSubscription(data);
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Remove from database
      if (subscription) {
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id);

        if (error) {
          console.error('Error removing push subscription:', error);
          throw error;
        }
      }

      setIsSubscribed(false);
      setSubscription(null);
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe
  };
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
