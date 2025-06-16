
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { useCommunications, CommunicationTemplate } from '../hooks/useCommunications';
import { useToast } from '@/hooks/use-toast';

interface CommunicationDialogProps {
  leadId: string;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  trigger?: React.ReactNode;
}

const CommunicationDialog: React.FC<CommunicationDialogProps> = ({
  leadId,
  leadName,
  leadEmail,
  leadPhone,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'email' | 'sms' | 'call' | 'note'>('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { templates, sendCommunication } = useCommunications(leadId);
  const { toast } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setType(template.type as 'email' | 'sms' | 'call' | 'note');
      setSubject(template.subject || '');
      
      // Replace template variables with actual values
      let processedContent = template.content;
      processedContent = processedContent.replace(/{first_name}/g, leadName.split(' ')[0] || '');
      processedContent = processedContent.replace(/{last_name}/g, leadName.split(' ').slice(1).join(' ') || '');
      processedContent = processedContent.replace(/{full_name}/g, leadName);
      
      setContent(processedContent);
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    try {
      const communicationData = {
        lead_id: leadId,
        type,
        subject: type === 'email' ? subject : undefined,
        content,
        recipient_email: type === 'email' ? leadEmail : undefined,
        recipient_phone: type === 'sms' ? leadPhone : undefined,
        status: 'sent' as const
      };

      await sendCommunication(communicationData);
      
      toast({
        title: "Communication Sent",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} sent successfully to ${leadName}.`,
      });

      setOpen(false);
      setSubject('');
      setContent('');
      setSelectedTemplate('');
    } catch (error) {
      console.error('Error sending communication:', error);
      toast({
        title: "Error",
        description: "Failed to send communication. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {getIcon()}
            Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Communication to {leadName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Communication Type</Label>
              <Select value={type} onValueChange={(value: 'email' | 'sms' | 'call' | 'note') => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.type === type).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'email' && (
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
          )}

          <div>
            <Label htmlFor="content">
              {type === 'call' ? 'Call Notes' : 'Content'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Enter ${type} content...`}
              rows={6}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={!content.trim()}>
              {type === 'call' ? 'Log Call' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunicationDialog;
