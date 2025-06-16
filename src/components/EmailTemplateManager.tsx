
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCommunications, CommunicationTemplate } from '../hooks/useCommunications';
import { useToast } from '@/hooks/use-toast';

const EmailTemplateManager: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'email' | 'sms' | 'call' | 'note'>('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useCommunications();
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setType('email');
    setSubject('');
    setContent('');
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    try {
      const templateData = {
        name,
        type,
        subject: type === 'email' ? subject : undefined,
        content,
        is_active: true,
        variables: ['first_name', 'last_name', 'full_name'] // Default variables
      };

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData);
        toast({
          title: "Template Updated",
          description: `Template "${name}" has been updated successfully.`,
        });
      } else {
        await createTemplate(templateData);
        toast({
          title: "Template Created",
          description: `Template "${name}" has been created successfully.`,
        });
      }
      
      setOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: CommunicationTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setType(template.type as 'email' | 'sms' | 'call' | 'note');
    setSubject(template.subject || '');
    setContent(template.content);
    setOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully.",
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
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
              {type === 'email' && (
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter template content. Use {first_name}, {last_name}, {full_name} for variables."
                  rows={8}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!name.trim() || !content.trim()}>
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500 capitalize">{template.type}</div>
            </CardHeader>
            <CardContent>
              {template.subject && (
                <div className="mb-2">
                  <span className="font-medium">Subject:</span> {template.subject}
                </div>
              )}
              <div className="text-sm text-gray-600 line-clamp-3">
                {template.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EmailTemplateManager;
