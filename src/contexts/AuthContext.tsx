
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'agent';
  department?: string;
  status: 'active' | 'inactive';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'agent') => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const logSession = async (userId: string, action: 'login' | 'logout') => {
    try {
      if (action === 'login') {
        await supabase
          .from('login_sessions')
          .insert({
            user_id: userId,
            login_time: new Date().toISOString(),
            ip_address: null, // Could be enhanced with actual IP detection
            user_agent: navigator.userAgent
          });
      } else {
        // Update the latest session with logout time
        const { data: sessions } = await supabase
          .from('login_sessions')
          .select('*')
          .eq('user_id', userId)
          .is('logout_time', null)
          .order('login_time', { ascending: false })
          .limit(1);

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          const logoutTime = new Date();
          const sessionDuration = Math.floor(
            (logoutTime.getTime() - new Date(session.login_time).getTime()) / 1000
          );

          await supabase
            .from('login_sessions')
            .update({
              logout_time: logoutTime.toISOString(),
              session_duration: sessionDuration
            })
            .eq('id', session.id);
        }
      }
    } catch (error) {
      console.error('Error logging session:', error);
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
