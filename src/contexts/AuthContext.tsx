
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '../types/auth';
import { useProfile } from '../hooks/useProfile';
import { logSession } from '../utils/sessionLogger';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profile, setProfile, fetchProfile } = useProfile();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to avoid potential deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
            if (event === 'SIGNED_IN') {
              logSession(session.user.id, 'login');
            }
          }, 0);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, setProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      // Session will be handled by the onAuthStateChange listener
      return {};
    } catch (error) {
      setIsLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'agent') => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role
          }
        }
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      setIsLoading(false);
      return {};
    } catch (error) {
      setIsLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    if (user) {
      await logSession(user.id, 'logout');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      login, 
      signUp, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
