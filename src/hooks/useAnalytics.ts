
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface AnalyticsSnapshot {
  id: string;
  snapshot_date: string;
  total_leads: number;
  new_leads_today: number;
  active_leads: number;
  converted_leads: number;
  total_deposits: number;
  average_deposit: number;
  kyc_pending: number;
  kyc_approved: number;
  kyc_rejected: number;
  activities_count: number;
  communications_sent: number;
  appointments_scheduled: number;
  conversion_rate: number;
  metadata?: any;
  created_at: string;
}

export interface LeadScore {
  id: string;
  lead_id: string;
  score: number;
  score_factors?: any;
  calculated_at: string;
  calculated_by?: string;
  version?: string;
}

export const useAnalytics = () => {
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalyticsSnapshots = async (days: number = 30) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false });

      if (error) {
        console.error('Error fetching analytics snapshots:', error);
        setError(error.message);
        return;
      }

      setSnapshots(data || []);
    } catch (err) {
      console.error('Error fetching analytics snapshots:', err);
      setError('Failed to fetch analytics snapshots');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeadScores = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('lead_scores')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching lead scores:', error);
        return;
      }

      setLeadScores(data || []);
    } catch (err) {
      console.error('Error fetching lead scores:', err);
    }
  };

  const generateSnapshot = async (targetDate?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('generate_daily_analytics_snapshot', {
        target_date: targetDate || new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error generating snapshot:', error);
        throw error;
      }

      await fetchAnalyticsSnapshots();
    } catch (err) {
      console.error('Error generating snapshot:', err);
      throw err;
    }
  };

  const calculateLeadScore = async (leadId: string) => {
    if (!user) return;

    try {
      // This would typically call an AI edge function
      // For now, we'll create a basic scoring algorithm
      const score = Math.floor(Math.random() * 100); // Placeholder
      
      const { error } = await supabase
        .from('lead_scores')
        .insert([{
          lead_id: leadId,
          score: score,
          score_factors: {
            activity_level: Math.floor(Math.random() * 30),
            engagement_quality: Math.floor(Math.random() * 25),
            deposit_potential: Math.floor(Math.random() * 25),
            kyc_completion: Math.floor(Math.random() * 20)
          },
          calculated_by: 'basic_algorithm'
        }]);

      if (error) {
        console.error('Error calculating lead score:', error);
        throw error;
      }

      await fetchLeadScores();
    } catch (err) {
      console.error('Error calculating lead score:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAnalyticsSnapshots();
    fetchLeadScores();
  }, [user]);

  return { 
    snapshots, 
    leadScores,
    isLoading, 
    error, 
    fetchAnalyticsSnapshots,
    generateSnapshot,
    calculateLeadScore
  };
};
