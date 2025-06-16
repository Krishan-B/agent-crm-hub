
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageSquare, Webhook, Globe } from 'lucide-react';
import CalendarIntegration from '../components/integrations/CalendarIntegration';
import SMSIntegration from '../components/integrations/SMSIntegration';
import WebhookManager from '../components/integrations/WebhookManager';
import APIEndpoints from '../components/integrations/APIEndpoints';

const Integrations: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-600">Connect your CRM with external services and APIs</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarIntegration />
        </TabsContent>

        <TabsContent value="sms">
          <SMSIntegration />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="api">
          <APIEndpoints />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrations;
