import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  Calendar,
  Mail,
  Settings,
  ShieldCheck,
  Bell,
  ListChecks,
  Workflow
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';

const SidebarComponent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="font-bold">Plexop CRM</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/leads" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Leads</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/optimized-leads" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Optimized Leads</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/analytics" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/communications" className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Communications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/calendar" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/email-templates" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/workflow-automation" className="flex items-center space-x-2">
                    <Workflow className="h-4 w-4" />
                    <span>Workflow Automation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/data-management" className="flex items-center space-x-2">
                    <ListChecks className="h-4 w-4" />
                    <span>Data Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/integrations" className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>Integrations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/reports" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/notifications" className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/user-management" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>User Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/settings" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/security" className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Security</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            {user?.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url as string} alt={user.email || "Avatar"} />
            ) : (
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium">{user?.email}</span>
        </div>
        <SidebarMenuButton onClick={logout} className="mt-2 w-full justify-center">
          Logout
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarComponent;
