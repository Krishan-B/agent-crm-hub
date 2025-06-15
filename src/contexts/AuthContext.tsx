
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent';
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('crmUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - in real app, this would call your API
    if (email === 'admin@crm.com' && password === 'password') {
      const adminUser: User = {
        id: '1',
        email: 'admin@crm.com',
        firstName: 'John',
        lastName: 'Admin',
        role: 'admin',
        department: 'Management'
      };
      setUser(adminUser);
      localStorage.setItem('crmUser', JSON.stringify(adminUser));
      setIsLoading(false);
      return true;
    } else if (email === 'agent@crm.com' && password === 'password') {
      const agentUser: User = {
        id: '2',
        email: 'agent@crm.com',
        firstName: 'Jane',
        lastName: 'Agent',
        role: 'agent',
        department: 'Sales'
      };
      setUser(agentUser);
      localStorage.setItem('crmUser', JSON.stringify(agentUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crmUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
