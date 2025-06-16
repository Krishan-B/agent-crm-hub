
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
}

export const useRealTimeData = ({
  onLeadsChange,
  onActivitiesChange,
  onTransactionsChange,
  onKycDocumentsChange,
  onProfilesChange,
  onCommunicationsChange,
  onAppointmentsChange
}: UseRealTimeDataProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const subscriptions: any[] = [];

    // Subscribe to leads changes
    if (onLeadsChange) {
      const leadsSubscription = supabase
        .channel('leads-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'leads'
        }, () => {
          console.log('Leads data changed');
          onLeadsChange();
        })
        .subscribe();
      
      subscriptions.push(leadsSubscription);
    }

    // Subscribe to activities changes
    if (onActivitiesChange) {
      const activitiesSubscription = supabase
        .channel('activities-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lead_activities'
        }, () => {
          console.log('Activities data changed');
          onActivitiesChange();
        })
        .subscribe();
      
      subscriptions.push(activitiesSubscription);
    }

    // Subscribe to transactions changes
    if (onTransactionsChange) {
      const transactionsSubscription = supabase
        .channel('transactions-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions'
        }, () => {
          console.log('Transactions data changed');
          onTransactionsChange();
        })
        .subscribe();
      
      subscriptions.push(transactionsSubscription);
    }

    // Subscribe to KYC documents changes
    if (onKycDocumentsChange) {
      const kycSubscription = supabase
        .channel('kyc-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'kyc_documents'
        }, () => {
          console.log('KYC documents data changed');
          onKycDocumentsChange();
        })
        .subscribe();
      
      subscriptions.push(kycSubscription);
    }

    // Subscribe to profiles changes (for admins)
    if (onProfilesChange) {
      const profilesSubscription = supabase
        .channel('profiles-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => {
          console.log('Profiles data changed');
          onProfilesChange();
        })
        .subscribe();
      
      subscriptions.push(profilesSubscription);
    }

    // Subscribe to communications changes
    if (onCommunicationsChange) {
      const communicationsSubscription = supabase
        .channel('communications-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'communications'
        }, () => {
          console.log('Communications data changed');
          onCommunicationsChange();
        })
        .subscribe();
      
      subscriptions.push(communicationsSubscription);
    }

    // Subscribe to appointments changes
    if (onAppointmentsChange) {
      const appointmentsSubscription = supabase
        .channel('appointments-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'appointments'
        }, () => {
          console.log('Appointments data changed');
          onAppointmentsChange();
        })
        .subscribe();
      
      subscriptions.push(appointmentsSubscription);
    }

    // Cleanup function
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, [user, onLeadsChange, onActivitiesChange, onTransactionsChange, onKycDocumentsChange, onProfilesChange, onCommunicationsChange, onAppointmentsChange]);
};
