
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Users, Phone } from 'lucide-react';
import { useSMSService } from '../../hooks/useSMSService';
import { useCommunications } from '../../hooks/useCommunications';
import { useToast } from '@/hooks/use-toast';

const SMSIntegration: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [bulkRecipients, setBulkRecipients] = useState('');
  const { sendSMS, sendBulkSMS, isLoading } = useSMSService();
  const { templates } = useCommunications();
  const { toast } = useToast();

  const smsTemplates = templates.filter(t => t.type === 'sms');

  const handleSendSMS = async () => {
    if (!recipient || !message) {
      toast({
        title: "Missing Information",
        description: "Please enter both recipient and message.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendSMS(recipient, message, selectedTemplate);
      toast({
        title: "SMS Sent",
        description: `Message sent successfully to ${recipient}.`,
      });
      setRecipient('');
      setMessage('');
      setSelectedTemplate('');
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkSMS = async () => {
    const recipients = bulkRecipients.split('\n').filter(r => r.trim());
    
    if (recipients.length === 0 || !message) {
      toast({
        title: "Missing Information",
        description: "Please enter both recipients and message.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendBulkSMS(recipients, message, selectedTemplate);
      toast({
        title: "Bulk SMS Sent",
        description: `Messages sent to ${recipients.length} recipients.`,
      });
      setBulkRecipients('');
      setMessage('');
      setSelectedTemplate('');
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send bulk SMS. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = smsTemplates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
      setSelectedTemplate(templateId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            SMS Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Single SMS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Send Single SMS
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Phone Number</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+1234567890"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose template" />
                  </SelectTrigger>
                  <SelectContent>
                    {smsTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  {message.length}/160 characters
                </p>
              </div>

              <Button 
                onClick={handleSendSMS} 
                disabled={isLoading || !recipient || !message}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send SMS
              </Button>
            </div>

            {/* Bulk SMS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Send Bulk SMS
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="bulkRecipients">Recipients (one per line)</Label>
                <Textarea
                  id="bulkRecipients"
                  value={bulkRecipients}
                  onChange={(e) => setBulkRecipients(e.target.value)}
                  placeholder="+1234567890&#10;+0987654321&#10;+1122334455"
                  rows={6}
                />
                <p className="text-sm text-gray-500">
                  {bulkRecipients.split('\n').filter(r => r.trim()).length} recipients
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose template" />
                  </SelectTrigger>
                  <SelectContent>
                    {smsTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkMessage">Message</Label>
                <Textarea
                  id="bulkMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleBulkSMS} 
                disabled={isLoading || !bulkRecipients || !message}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Bulk SMS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSIntegration;
