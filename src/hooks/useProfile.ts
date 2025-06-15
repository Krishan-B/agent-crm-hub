
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '../types/auth';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Type assertion to ensure compatibility with our UserProfile interface
      const typedProfile: UserProfile = {
        ...data,
        role: data.role as 'admin' | 'agent',
        status: data.status as 'active' | 'inactive'
      };

      setProfile(typedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  return { profile, setProfile, fetchProfile };
};
