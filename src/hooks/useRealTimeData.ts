
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseRealTimeDataProps {
  onLeadsChange?: () => void;
  onActivitiesChange?: () => void;
  onTransactionsChange?: () => void;
  onKycDocumentsChange?: () => void;
  onProfilesChange?: () => void;
  onCommunicationsChange?: () => void;
  onAppointmentsChange?: () => void;
  onNotificationsChange?: () => void;
}

export const useRealTimeData = ({
  onLeadsChange,
  onActivitiesChange,
  onTransactionsChange,
  onKycDocumentsChange,
  onProfilesChange,
  onCommunicationsChange,
  onAppointmentsChange,
  onNotificationsChange
}: UseRealTimeDataProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Subscribe to leads changes
    if (onLeadsChange) {
      const leadsChannel = supabase
        .channel(`leads-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'leads'
        }, () => {
          console.log('Leads data changed');
          onLeadsChange();
        })
        .subscribe();
      
      channels.push(leadsChannel);
    }

    // Subscribe to activities changes
    if (onActivitiesChange) {
      const activitiesChannel = supabase
        .channel(`activities-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lead_activities'
        }, () => {
          console.log('Activities data changed');
          onActivitiesChange();
        })
        .subscribe();
      
      channels.push(activitiesChannel);
    }

    // Subscribe to transactions changes
    if (onTransactionsChange) {
      const transactionsChannel = supabase
        .channel(`transactions-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions'
        }, () => {
          console.log('Transactions data changed');
          onTransactionsChange();
        })
        .subscribe();
      
      channels.push(transactionsChannel);
    }

    // Subscribe to KYC documents changes
    if (onKycDocumentsChange) {
      const kycChannel = supabase
        .channel(`kyc-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'kyc_documents'
        }, () => {
          console.log('KYC documents data changed');
          onKycDocumentsChange();
        })
        .subscribe();
      
      channels.push(kycChannel);
    }

    // Subscribe to profiles changes (for admins)
    if (onProfilesChange) {
      const profilesChannel = supabase
        .channel(`profiles-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => {
          console.log('Profiles data changed');
          onProfilesChange();
        })
        .subscribe();
      
      channels.push(profilesChannel);
    }

    // Subscribe to communications changes
    if (onCommunicationsChange) {
      const communicationsChannel = supabase
        .channel(`communications-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'communications'
        }, () => {
          console.log('Communications data changed');
          onCommunicationsChange();
        })
        .subscribe();
      
      channels.push(communicationsChannel);
    }

    // Subscribe to appointments changes
    if (onAppointmentsChange) {
      const appointmentsChannel = supabase
        .channel(`appointments-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'appointments'
        }, () => {
          console.log('Appointments data changed');
          onAppointmentsChange();
        })
        .subscribe();
      
      channels.push(appointmentsChannel);
    }

    // Subscribe to notifications changes
    if (onNotificationsChange) {
      const notificationsChannel = supabase
        .channel(`notifications-changes-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Notifications data changed');
          onNotificationsChange();
        })
        .subscribe();
      
      channels.push(notificationsChannel);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up realtime subscriptions');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, onLeadsChange, onActivitiesChange, onTransactionsChange, onKycDocumentsChange, onProfilesChange, onCommunicationsChange, onAppointmentsChange, onNotificationsChange]);
};
