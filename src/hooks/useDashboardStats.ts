
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface DashboardStats {
  totalLeads: number;
  kycApproved: number;
  pendingKyc: number;
  activeToday: number;
}

export interface RecentLead {
  id: string;
  name: string;
  email: string;
  status: string;
  country: string;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    kycApproved: 0,
    pendingKyc: 0,
    activeToday: 0
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch total leads count
      const { count: totalLeads, error: totalError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total leads:', totalError);
      }

      // Fetch KYC approved count
      const { count: kycApproved, error: kycApprovedError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_status', 'approved');

      if (kycApprovedError) {
        console.error('Error fetching KYC approved:', kycApprovedError);
      }

      // Fetch pending KYC count
      const { count: pendingKyc, error: pendingKycError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('kyc_status', ['pending', 'submitted']);

      if (pendingKycError) {
        console.error('Error fetching pending KYC:', pendingKycError);
      }

      // Fetch today's active leads (leads with activities today)
      const today = new Date().toISOString().split('T')[0];
      const { count: activeToday, error: activeTodayError } = await supabase
        .from('lead_activities')
        .select('lead_id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      if (activeTodayError) {
        console.error('Error fetching active today:', activeTodayError);
      }

      setStats({
        totalLeads: totalLeads || 0,
        kycApproved: kycApproved || 0,
        pendingKyc: pendingKyc || 0,
        activeToday: activeToday || 0
      });

      // Fetch recent leads
      const { data: recentLeadsData, error: recentLeadsError } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, status, country')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentLeadsError) {
        console.error('Error fetching recent leads:', recentLeadsError);
      } else {
        const formattedRecentLeads = recentLeadsData?.map(lead => ({
          id: lead.id,
          name: `${lead.first_name} ${lead.last_name}`,
          email: lead.email,
          status: lead.status,
          country: lead.country
        })) || [];
        
        setRecentLeads(formattedRecentLeads);
      }

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return { stats, recentLeads, isLoading, error, fetchStats };
};
