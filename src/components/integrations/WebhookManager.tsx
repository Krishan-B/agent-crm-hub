
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Webhook, Plus, Edit, Trash2, Activity, ExternalLink } from 'lucide-react';
import { useWebhooks } from '../../hooks/useWebhooks';
import { useToast } from '@/hooks/use-toast';

const WebhookManager: React.FC = () => {
  const { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook, triggerWebhook } = useWebhooks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    is_active: true,
    retry_count: 3,
    timeout: 30,
    headers: {} as Record<string, string>
  });
  const { toast } = useToast();

  const availableEvents = [
    'lead.created',
    'lead.updated',
    'lead.assigned',
    'lead.status_changed',
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
    'communication.sent',
    'kyc.submitted',
    'kyc.approved',
    'kyc.rejected',
    'balance.updated'
  ];

  const handleSave = async () => {
    try {
      if (editingWebhook) {
        await updateWebhook(editingWebhook.id, newWebhook);
        toast({
          title: "Webhook Updated",
          description: "Webhook has been updated successfully.",
        });
      } else {
        await createWebhook({
          ...newWebhook,
          secret: generateSecret()
        });
        toast({
          title: "Webhook Created",
          description: "Webhook has been created successfully.",
        });
      }
      
      setIsDialogOpen(false);
      setEditingWebhook(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save webhook.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWebhook(id);
      toast({
        title: "Webhook Deleted",
        description: "Webhook has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook.",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      await triggerWebhook(webhookId, 'test.webhook', {
        message: 'This is a test webhook',
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Test Sent",
        description: "Test webhook has been triggered.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to trigger test webhook.",
        variant: "destructive",
      });
    }
  };

  const generateSecret = () => {
    return 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const resetForm = () => {
    setNewWebhook({
      name: '',
      url: '',
      events: [],
      is_active: true,
      retry_count: 3,
      timeout: 30,
      headers: {}
    });
  };

  const openEditDialog = (webhook: any) => {
    setEditingWebhook(webhook);
    setNewWebhook({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
      retry_count: webhook.retry_count,
      timeout: webhook.timeout,
      headers: webhook.headers || {}
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Webhook className="h-5 w-5 mr-2" />
              Webhook Management
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Webhook"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {availableEvents.map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={event}
                            checked={newWebhook.events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewWebhook(prev => ({ ...prev, events: [...prev.events, event] }));
                              } else {
                                setNewWebhook(prev => ({ ...prev, events: prev.events.filter(e => e !== event) }));
                              }
                            }}
                          />
                          <Label htmlFor={event} className="text-sm">{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newWebhook.is_active}
                      onCheckedChange={(checked) => setNewWebhook(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                  
                  <Button onClick={handleSave} className="w-full" disabled={isLoading}>
                    {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell className="truncate max-w-xs">{webhook.url}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={webhook.is_active ? "default" : "secondary"}>
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(webhook.id)}
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(webhook)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {webhooks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No webhooks configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManager;
