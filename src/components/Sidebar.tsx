
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Calendar, User, Bell, BarChart3, Mail, Settings, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: User },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Communications', href: '/communications', icon: Bell },
    { name: 'Email Templates', href: '/email-templates', icon: Mail },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const adminNavigation = [
    { name: 'User Management', href: '/users', icon: User },
  ];

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <nav className="p-4 space-y-2">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={handleNavClick}
          className={({ isActive }) =>
            cn(
              'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-target',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            )
          }
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{item.name}</span>
        </NavLink>
      ))}
      
      {user?.role === 'admin' && (
        <>
          <div className="border-t border-gray-200 my-4"></div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
            Admin
          </div>
          {adminNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-target',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </>
      )}
    </nav>
  );
};

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Mobile sidebar is handled by the mobile menu in Header
  }

  return (
    <div className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:border-r md:border-gray-200 md:pt-16 md:block">
      <div className="flex flex-col h-full overflow-y-auto">
        <SidebarContent />
      </div>
    </div>
  );
};

export { SidebarContent };
export default Sidebar;
