
import React, { useState } from 'react';
import { Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import NotificationCenter from './NotificationCenter';

const Header: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Mobile menu and logo */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="font-bold text-lg sm:text-xl text-blue-600 truncate">
            <span className="hidden sm:inline">Plexop CRM</span>
            <span className="sm:hidden">Plexop</span>
          </div>
        </div>

        {/* Desktop search */}
        <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search leads, customers..." 
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Mobile search toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <NotificationCenter />
          
          {/* Desktop user info */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center touch-target">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden lg:block">
              <div className="text-sm font-medium truncate max-w-32">
                {profile ? `${profile.first_name} ${profile.last_name}` : user?.email || 'User'}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {profile?.role || 'User'}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="hidden lg:inline-flex">
              Logout
            </Button>
          </div>

          {/* Mobile user menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="sm:hidden p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col space-y-4 mt-6">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {profile ? `${profile.first_name} ${profile.last_name}` : user?.email || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {profile?.role || 'User'}
                    </div>
                  </div>
                </div>
                <Button onClick={logout} className="w-full">
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="md:hidden mt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search leads, customers..." 
              className="pl-10 w-full"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
