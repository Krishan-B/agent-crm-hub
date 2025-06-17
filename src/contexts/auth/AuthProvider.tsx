
import React, { createContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, UserProfile } from './types';
import { fetchUserProfile, createAuditLog } from './utils';
import { performLogin, performSignUp, performLogout } from './authOperations';
import { logSession } from '../../utils/sessionLogger';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleProfileFetch = async (userId: string) => {
    const profileData = await fetchUserProfile(userId);
    setProfile(profileData);
  };

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
            handleProfileFetch(session.user.id);
            if (event === 'SIGNED_IN') {
              logSession(session.user.id, 'login');
              // Log successful login
              createAuditLog(session.user.id, 'login', null, navigator.userAgent);
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
        handleProfileFetch(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await performLogin(email, password);
    setIsLoading(false);
    return result;
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'agent') => {
    setIsLoading(true);
    const result = await performSignUp(email, password, firstName, lastName, role);
    setIsLoading(false);
    return result;
  };

  const logout = async () => {
    if (user) {
      await performLogout(user.id);
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
