
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Calendar, User, Bell, BarChart3, Mail, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
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

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 pt-16">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        
        {user?.role === 'admin' && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3">
              Admin
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
