
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { EscalationRule } from '../types/workflow';

export const useEscalationRules = () => {
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createEscalationRule = async (ruleData: Omit<EscalationRule, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .insert([{
          name: ruleData.name,
          trigger_condition: ruleData.trigger_condition,
          escalation_levels: ruleData.escalation_levels as any,
          is_active: ruleData.is_active
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchEscalationRules();
      return data;
    } catch (err) {
      console.error('Error creating escalation rule:', err);
      throw err;
    }
  };

  const fetchEscalationRules = async () => {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Safely cast the database types to our TypeScript types
      const rules = (data || []).map(rule => ({
        ...rule,
        escalation_levels: Array.isArray(rule.escalation_levels) ? rule.escalation_levels as unknown as EscalationRule['escalation_levels'] : []
      }));
      
      setEscalationRules(rules);
    } catch (err) {
      console.error('Error fetching escalation rules:', err);
      setError('Failed to fetch escalation rules');
    }
  };

  useEffect(() => {
    if (user) {
      fetchEscalationRules();
    }
  }, [user]);

  return {
    escalationRules,
    isLoading,
    error,
    createEscalationRule,
    fetchEscalationRules
  };
};
