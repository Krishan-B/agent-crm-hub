
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useRealTimeData } from './useRealTimeData';
import { dashboardCache } from '@/utils/cache';

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
    
    // Check cache first
    const cacheKey = `dashboard_stats_${user.id}`;
    const cached = dashboardCache.get(cacheKey);
    if (cached) {
      setStats(cached.stats);
      setRecentLeads(cached.recentLeads);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use parallel queries for better performance
      const [
        totalLeadsResult,
        kycApprovedResult,
        pendingKycResult,
        activeTodayResult,
        recentLeadsResult
      ] = await Promise.all([
        // Total leads count
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true }),
        
        // KYC approved count
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('kyc_status', 'approved'),
        
        // Pending KYC count
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('kyc_status', ['pending', 'submitted']),
        
        // Today's active leads (with activities)
        supabase
          .from('lead_activities')
          .select('lead_id', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')
          .lte('created_at', new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'),
        
        // Recent leads (optimized query)
        supabase
          .from('leads')
          .select('id, first_name, last_name, email, status, country')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const newStats = {
        totalLeads: totalLeadsResult.count || 0,
        kycApproved: kycApprovedResult.count || 0,
        pendingKyc: pendingKycResult.count || 0,
        activeToday: activeTodayResult.count || 0
      };

      const formattedRecentLeads = recentLeadsResult.data?.map(lead => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        status: lead.status,
        country: lead.country
      })) || [];

      setStats(newStats);
      setRecentLeads(formattedRecentLeads);

      // Cache the results
      dashboardCache.set(cacheKey, {
        stats: newStats,
        recentLeads: formattedRecentLeads
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions to refresh stats when data changes
  useRealTimeData({
    onLeadsChange: () => {
      dashboardCache.clear();
      fetchStats();
    },
    onActivitiesChange: () => {
      dashboardCache.clear();
      fetchStats();
    },
    onKycDocumentsChange: () => {
      dashboardCache.clear();
      fetchStats();
    }
  });

  useEffect(() => {
    fetchStats();
  }, [user]);

  return { stats, recentLeads, isLoading, error, fetchStats };
};
