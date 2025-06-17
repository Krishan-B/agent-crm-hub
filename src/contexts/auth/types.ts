
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'agent';
  department?: string;
  status: 'active' | 'inactive';
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'admin' | 'agent') => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}
