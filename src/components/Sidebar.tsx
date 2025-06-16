
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Settings, Calendar, Mail, LayoutDashboard, Bell, Shield, Database } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { profile, logout, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications] = useState<any[]>([]);

  const getLinkClass = (path: string) => {
    return cn(
      "flex items-center space-x-2 text-sm font-medium",
      location.pathname === path
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    );
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/login');
  };

  return (
    <div className="border-r flex flex-col h-full">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden w-full justify-start pl-4">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <SheetHeader className="space-y-2 border-b pb-4">
            <SheetTitle>Plexop CRM</SheetTitle>
            <SheetDescription>
              Manage your business from one central location.
            </SheetDescription>
          </SheetHeader>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start pl-4">
                    <Link to="/" className={getLinkClass('/')}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                </SheetTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start pl-4">
                    <Link to="/leads" className={getLinkClass('/leads')}>
                      <Home className="h-4 w-4" />
                      Leads
                    </Link>
                  </Button>
                </SheetTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start pl-4">
                    <Link to="/communications" className={getLinkClass('/communications')}>
                      <Mail className="h-4 w-4" />
                      Communications
                    </Link>
                  </Button>
                </SheetTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start pl-4">
                    <Link to="/calendar" className={getLinkClass('/calendar')}>
                      <Calendar className="h-4 w-4" />
                      Calendar
                    </Link>
                  </Button>
                </SheetTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start pl-4">
                    <Link to="/settings" className={getLinkClass('/settings')}>
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                </SheetTrigger>
              </NavigationMenuItem>
              {profile?.role === 'admin' && (
                <>
                  <NavigationMenuItem>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start pl-4">
                        <Link to="/user-management" className={getLinkClass('/user-management')}>
                          <Users className="h-4 w-4" />
                          User Management
                        </Link>
                      </Button>
                    </SheetTrigger>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start pl-4">
                        <Link to="/security" className={getLinkClass('/security')}>
                          <Shield className="h-4 w-4" />
                          Security
                        </Link>
                      </Button>
                    </SheetTrigger>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start pl-4">
                        <Link to="/data-management" className={getLinkClass('/data-management')}>
                          <Database className="h-4 w-4" />
                          Data Management
                        </Link>
                      </Button>
                    </SheetTrigger>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col justify-between">
        <div className="p-4">
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button variant="ghost" className="w-full justify-start pl-4">
                  <Link to="/" className={getLinkClass('/')}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" className="w-full justify-start pl-4">
                  <Link to="/leads" className={getLinkClass('/leads')}>
                    <Home className="h-4 w-4" />
                    Leads
                  </Link>
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" className="w-full justify-start pl-4">
                  <Link to="/communications" className={getLinkClass('/communications')}>
                    <Mail className="h-4 w-4" />
                    Communications
                  </Link>
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" className="w-full justify-start pl-4">
                  <Link to="/calendar" className={getLinkClass('/calendar')}>
                    <Calendar className="h-4 w-4" />
                    Calendar
                  </Link>
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" className="w-full justify-start pl-4">
                  <Link to="/settings" className={getLinkClass('/settings')}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </NavigationMenuItem>
              {profile?.role === 'admin' && (
                <>
                  <NavigationMenuItem>
                    <Button variant="ghost" className="w-full justify-start pl-4">
                      <Link to="/user-management" className={getLinkClass('/user-management')}>
                        <Users className="h-4 w-4" />
                        User Management
                      </Link>
                    </Button>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Button variant="ghost" className="w-full justify-start pl-4">
                      <Link to="/security" className={getLinkClass('/security')}>
                        <Shield className="h-4 w-4" />
                        Security
                      </Link>
                    </Button>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Button variant="ghost" className="w-full justify-start pl-4">
                      <Link to="/data-management" className={getLinkClass('/data-management')}>
                        <Database className="h-4 w-4" />
                        Data Management
                      </Link>
                    </Button>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <Separator />

        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start pl-4">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={profile?.first_name} />
                  <AvatarFallback>{profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="font-semibold">{profile?.first_name} {profile?.last_name}</span>
                  <span className="text-muted-foreground text-sm">{profile?.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {notifications.length}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
