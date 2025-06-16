
import React from 'react';
import { Search, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NotificationCenter from './NotificationCenter';

const Header: React.FC = () => {
  const { user, profile, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-xl text-blue-600">Plexop CRM</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search leads, customers..." 
              className="pl-10 w-96"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium">
                {profile ? `${profile.first_name} ${profile.last_name}` : user?.email || 'User'}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {profile?.role || 'User'}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
