
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Mail, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWorkflowAutomation } from '../../hooks/useWorkflowAutomation';
import { useCommunications } from '../../hooks/useCommunications';
import { useToast } from '@/hooks/use-toast';
import type { WorkflowRule } from '../../types/workflow';

const EmailAutomation: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'email_automation' as const,
    conditions: [],
    actions: [],
    is_active: true,
    priority: 1
  });

  const { workflowRules, createWorkflowRule, updateWorkflowRule, deleteWorkflowRule, isLoading } = useWorkflowAutomation();
  const { templates } = useCommunications();
  const { toast } = useToast();

  const emailRules = workflowRules.filter(rule => rule.type === 'email_automation');

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await updateWorkflowRule(editingRule.id, newRule);
        toast({
          title: "Rule Updated",
          description: "Email automation rule has been updated successfully.",
        });
      } else {
        await createWorkflowRule(newRule);
        toast({
          title: "Rule Created",
          description: "New email automation rule has been created successfully.",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email automation rule.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewRule({
      name: '',
      type: 'email_automation',
      conditions: [],
      actions: [],
      is_active: true,
      priority: 1
    });
    setEditingRule(null);
  };

  const addEmailTrigger = (trigger: string) => {
    setNewRule(prev => ({
      ...prev,
      conditions: [{
        field: 'trigger',
        operator: 'equals',
        value: trigger,
        logic: 'and'
      }]
    }));
  };

  const addEmailAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [{
        type: 'send_email',
        parameters: {
          template_id: '',
          delay_hours: 0,
          subject: '',
          content: ''
        }
      }]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Email Automation Workflows
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Email Workflow' : 'Create Email Workflow'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Workflow Name</Label>
                      <Input
                        id="name"
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Welcome Email Sequence"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={newRule.priority}
                        onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRule.is_active}
                      onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Email Triggers</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => addEmailTrigger('lead_created')}
                        className="h-16 flex flex-col"
                      >
                        <span className="font-medium">New Lead</span>
                        <span className="text-xs text-gray-500">When lead is created</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addEmailTrigger('kyc_submitted')}
                        className="h-16 flex flex-col"
                      >
                        <span className="font-medium">KYC Submitted</span>
                        <span className="text-xs text-gray-500">When KYC is submitted</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addEmailTrigger('no_activity')}
                        className="h-16 flex flex-col"
                      >
                        <span className="font-medium">No Activity</span>
                        <span className="text-xs text-gray-500">After X days of inactivity</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addEmailTrigger('deposit_made')}
                        className="h-16 flex flex-col"
                      >
                        <span className="font-medium">First Deposit</span>
                        <span className="text-xs text-gray-500">When deposit is made</span>
                      </Button>
                    </div>
                  </div>

                  {newRule.conditions.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Email Configuration</h4>
                      <Button variant="outline" onClick={addEmailAction}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email Step
                      </Button>
                      
                      {newRule.actions.map((action, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Email Step {index + 1}</h5>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewRule(prev => ({
                                  ...prev,
                                  actions: prev.actions.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Delay (hours)</Label>
                              <Input
                                type="number"
                                value={action.parameters.delay_hours || 0}
                                onChange={(e) => {
                                  const newActions = [...newRule.actions];
                                  newActions[index] = {
                                    ...action,
                                    parameters: {
                                      ...action.parameters,
                                      delay_hours: parseInt(e.target.value)
                                    }
                                  };
                                  setNewRule(prev => ({ ...prev, actions: newActions }));
                                }}
                                min="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email Template</Label>
                              <Select
                                value={action.parameters.template_id || ''}
                                onValueChange={(value) => {
                                  const newActions = [...newRule.actions];
                                  newActions[index] = {
                                    ...action,
                                    parameters: {
                                      ...action.parameters,
                                      template_id: value
                                    }
                                  };
                                  setNewRule(prev => ({ ...prev, actions: newActions }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                  {templates.filter(t => t.type === 'email').map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                      {template.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Subject Line</Label>
                            <Input
                              value={action.parameters.subject || ''}
                              onChange={(e) => {
                                const newActions = [...newRule.actions];
                                newActions[index] = {
                                  ...action,
                                  parameters: {
                                    ...action.parameters,
                                    subject: e.target.value
                                  }
                                };
                                setNewRule(prev => ({ ...prev, actions: newActions }));
                              }}
                              placeholder="Welcome to our platform!"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Email Content</Label>
                            <Textarea
                              value={action.parameters.content || ''}
                              onChange={(e) => {
                                const newActions = [...newRule.actions];
                                newActions[index] = {
                                  ...action,
                                  parameters: {
                                    ...action.parameters,
                                    content: e.target.value
                                  }
                                };
                                setNewRule(prev => ({ ...prev, actions: newActions }));
                              }}
                              placeholder="Email content..."
                              rows={4}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button onClick={handleSaveRule} className="w-full" disabled={isLoading}>
                    {editingRule ? 'Update Workflow' : 'Create Workflow'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {rule.actions.length} step(s)
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Trigger: {rule.conditions[0]?.value || 'Not configured'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setNewRule({
                          name: rule.name,
                          type: rule.type,
                          conditions: rule.conditions,
                          actions: rule.actions,
                          is_active: rule.is_active,
                          priority: rule.priority
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWorkflowRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {emailRules.length === 0 && (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No email workflows configured</p>
                <p className="text-sm text-gray-400">Create automated email sequences to engage leads</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAutomation;
