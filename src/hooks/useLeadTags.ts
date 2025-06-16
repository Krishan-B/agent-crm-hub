
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface LeadTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface LeadTagAssignment {
  id: string;
  lead_id: string;
  tag_id: string;
  assigned_by?: string;
  assigned_at: string;
  tag?: LeadTag;
}

export const useLeadTags = () => {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTags = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        setError(error.message);
        return;
      }

      setTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to fetch tags');
    } finally {
      setIsLoading(false);
    }
  };

  const assignTagToLead = async (leadId: string, tagId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lead_tag_assignments')
        .insert([{
          lead_id: leadId,
          tag_id: tagId,
          assigned_by: user.id
        }]);

      if (error) {
        console.error('Error assigning tag:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error assigning tag:', err);
      throw err;
    }
  };

  const removeTagFromLead = async (leadId: string, tagId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lead_tag_assignments')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (error) {
        console.error('Error removing tag:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error removing tag:', err);
      throw err;
    }
  };

  const getLeadTags = async (leadId: string): Promise<LeadTagAssignment[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('lead_tag_assignments')
        .select(`
          *,
          tag:lead_tags(*)
        `)
        .eq('lead_id', leadId);

      if (error) {
        console.error('Error fetching lead tags:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching lead tags:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  return { 
    tags, 
    isLoading, 
    error, 
    fetchTags, 
    assignTagToLead, 
    removeTagFromLead, 
    getLeadTags 
  };
};
