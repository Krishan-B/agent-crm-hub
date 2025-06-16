
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

const NotificationPreferences: React.FC = () => {
  const { preferences, updatePreference } = useNotifications();
  const { 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    isLoading 
  } = usePushNotifications();
  const { toast } = useToast();

  const notificationTypes = [
    {
      type: 'lead_assigned',
      title: 'Lead Assignment',
      description: 'When a new lead is assigned to you'
    },
    {
      type: 'kyc_submitted',
      title: 'KYC Submission',
      description: 'When a lead submits KYC documents'
    },
    {
      type: 'balance_updated',
      title: 'Balance Updates',
      description: 'When a lead\'s balance changes'
    },
    {
      type: 'appointment_reminder',
      title: 'Appointment Reminders',
      description: 'Reminders for upcoming appointments'
    },
    {
      type: 'communication_received',
      title: 'New Communications',
      description: 'When you receive new messages or emails'
    },
    {
      type: 'system_alert',
      title: 'System Alerts',
      description: 'Important system notifications and updates'
    }
  ];

  const handlePreferenceUpdate = async (
    notificationType: string, 
    field: 'email_enabled' | 'push_enabled' | 'in_app_enabled', 
    value: boolean
  ) => {
    try {
      await updatePreference(notificationType, { [field]: value });
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    }
  };

  const handlePushSubscription = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({
          title: 'Push notifications disabled',
          description: 'You will no longer receive push notifications.',
        });
      } else {
        await subscribe();
        toast({
          title: 'Push notifications enabled',
          description: 'You will now receive push notifications.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update push notification settings.',
        variant: 'destructive',
      });
    }
  };

  const getPreference = (type: string) => {
    return preferences.find(p => p.notification_type === type);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Enable browser push notifications to receive real-time alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Browser Push Notifications</Label>
              <p className="text-sm text-gray-500">
                {isSupported 
                  ? 'Receive notifications even when the app is closed'
                  : 'Push notifications are not supported in your browser'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isSupported && (
                <>
                  {isSubscribed && (
                    <Badge variant="secondary">Enabled</Badge>
                  )}
                  <Button
                    variant={isSubscribed ? "outline" : "default"}
                    size="sm"
                    onClick={handlePushSubscription}
                    disabled={!isSupported || isLoading}
                  >
                    {isLoading ? 'Processing...' : isSubscribed ? 'Disable' : 'Enable'}
                  </Button>
                </>
              )}
              {!isSupported && (
                <Badge variant="secondary">Not Supported</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose how you want to be notified for different types of events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notificationTypes.map((type) => {
              const preference = getPreference(type.type);
              return (
                <div key={type.type} className="space-y-3">
                  <div>
                    <h4 className="font-medium">{type.title}</h4>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${type.type}-email`}
                        checked={preference?.email_enabled ?? true}
                        onCheckedChange={(checked) => 
                          handlePreferenceUpdate(type.type, 'email_enabled', checked)
                        }
                      />
                      <Label htmlFor={`${type.type}-email`} className="text-sm">
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${type.type}-push`}
                        checked={preference?.push_enabled ?? true}
                        onCheckedChange={(checked) => 
                          handlePreferenceUpdate(type.type, 'push_enabled', checked)
                        }
                        disabled={!isSupported || !isSubscribed}
                      />
                      <Label htmlFor={`${type.type}-push`} className="text-sm">
                        Push
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${type.type}-app`}
                        checked={preference?.in_app_enabled ?? true}
                        onCheckedChange={(checked) => 
                          handlePreferenceUpdate(type.type, 'in_app_enabled', checked)
                        }
                      />
                      <Label htmlFor={`${type.type}-app`} className="text-sm">
                        In-App
                      </Label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
