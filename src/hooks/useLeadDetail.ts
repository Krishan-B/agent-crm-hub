
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Lead } from './useLeads';

export interface Activity {
  id: string;
  activity_type: string;
  content?: string;
  created_by?: string;
  created_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  created_at: string;
}

export interface KycDocument {
  id: string;
  document_type: string;
  file_path?: string;
  status: string;
  upload_date: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export const useLeadDetail = (leadId: string) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLeadDetail = async () => {
    if (!user || !leadId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch lead details
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_agent:profiles!assigned_agent_id(
            first_name,
            last_name
          )
        `)
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        setError(leadError.message);
        return;
      }

      setLead(leadData);

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('lead_activities')
        .select(`
          *,
          creator:profiles!created_by(
            first_name,
            last_name
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
      } else {
        setActivities(activitiesData || []);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }

      // Fetch KYC documents
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('lead_id', leadId)
        .order('upload_date', { ascending: false });

      if (kycError) {
        console.error('Error fetching KYC documents:', kycError);
      } else {
        setKycDocuments(kycData || []);
      }

    } catch (err) {
      console.error('Error fetching lead detail:', err);
      setError('Failed to fetch lead details');
    } finally {
      setIsLoading(false);
    }
  };

  const addActivity = async (activityType: string, content: string) => {
    if (!user || !leadId) return;

    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert([{
          lead_id: leadId,
          activity_type: activityType,
          content: content,
          created_by: user.id
        }]);

      if (error) {
        console.error('Error adding activity:', error);
        throw error;
      }

      await fetchLeadDetail(); // Refresh the data
    } catch (err) {
      console.error('Error adding activity:', err);
      throw err;
    }
  };

  const addTransaction = async (type: string, amount: number, reference: string) => {
    if (!user || !leadId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          lead_id: leadId,
          type: type,
          amount: amount,
          reference: reference
        }]);

      if (error) {
        console.error('Error adding transaction:', error);
        throw error;
      }

      // Update lead balance
      if (type === 'deposit' || type === 'bonus') {
        const currentBalance = lead?.balance || 0;
        const currentBonus = lead?.bonus_amount || 0;
        
        const newBalance = type === 'deposit' ? currentBalance + amount : currentBalance;
        const newBonus = type === 'bonus' ? currentBonus + amount : currentBonus;

        await supabase
          .from('leads')
          .update({ 
            balance: newBalance,
            bonus_amount: newBonus,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);
      }

      await fetchLeadDetail(); // Refresh the data
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLeadDetail();
  }, [leadId, user]);

  return { 
    lead, 
    activities, 
    transactions, 
    kycDocuments, 
    isLoading, 
    error, 
    fetchLeadDetail, 
    addActivity, 
    addTransaction 
  };
};
