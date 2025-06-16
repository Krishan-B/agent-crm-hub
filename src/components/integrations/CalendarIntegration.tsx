
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { useCalendarIntegration } from '../../hooks/useCalendarIntegration';
import { useToast } from '@/hooks/use-toast';

const CalendarIntegration: React.FC = () => {
  const {
    integrations,
    events,
    isLoading,
    error,
    connectGoogleCalendar,
    connectOutlookCalendar,
    syncCalendarEvents
  } = useCalendarIntegration();
  const { toast } = useToast();

  const handleConnect = async (provider: 'google' | 'outlook') => {
    try {
      if (provider === 'google') {
        await connectGoogleCalendar();
      } else {
        await connectOutlookCalendar();
      }
      
      toast({
        title: "Connecting...",
        description: `Redirecting to ${provider} for authorization.`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${provider} Calendar.`,
        variant: "destructive",
      });
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      await syncCalendarEvents(integrationId);
      toast({
        title: "Sync Complete",
        description: "Calendar events have been synchronized.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar events.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Calendar Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Google Calendar</h3>
                    <p className="text-sm text-gray-600">Sync with Google Calendar</p>
                  </div>
                  <Button 
                    onClick={() => handleConnect('google')}
                    disabled={isLoading}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Outlook Calendar</h3>
                    <p className="text-sm text-gray-600">Sync with Microsoft Outlook</p>
                  </div>
                  <Button 
                    onClick={() => handleConnect('outlook')}
                    disabled={isLoading}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {integrations.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-4">Connected Calendars</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">
                        {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(integration.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(integration.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarIntegration;
