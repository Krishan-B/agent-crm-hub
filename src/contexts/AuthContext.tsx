import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '../types/auth';
import { logSession } from '../utils/sessionLogger';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        // Ensure role and status are properly typed
        const profileData = {
          ...data,
          role: data.role as 'admin' | 'agent',
          status: data.status as 'active' | 'inactive'
        };
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
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
            fetchProfile(session.user.id);
            if (event === 'SIGNED_IN') {
              logSession(session.user.id, 'login');
              // Log successful login
              supabase.rpc('create_audit_log', {
                p_user_id: session.user.id,
                p_action: 'login',
                p_ip_address: null,
                p_user_agent: navigator.userAgent
              });
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
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Check rate limiting for login attempts
      const canAttemptLogin = await supabase.rpc('check_rate_limit', {
        p_identifier: email,
        p_action: 'login',
        p_limit: 5,
        p_window_minutes: 15
      });

      if (!canAttemptLogin.data) {
        setIsLoading(false);
        return { error: 'Too many login attempts. Please try again later.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Log failed login attempt
        await supabase.rpc('create_audit_log', {
          p_user_id: null,
          p_action: 'login_failed',
          p_new_values: { email, error: error.message },
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });
        
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
      // Log logout
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: 'logout',
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });
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
