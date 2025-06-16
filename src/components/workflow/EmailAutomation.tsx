
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Mail, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWorkflowAutomation } from '../../hooks/useWorkflowAutomation';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { WorkflowRule, WorkflowCondition, WorkflowAction } from '../../types/workflow';

const EmailAutomation: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'email_automation' as const,
    conditions: [] as WorkflowCondition[],
    actions: [] as WorkflowAction[],
    is_active: true,
    priority: 1
  });

  const { workflowRules, createWorkflowRule, updateWorkflowRule, deleteWorkflowRule, isLoading } = useWorkflowAutomation();
  const { user } = useAuth();
  const { toast } = useToast();

  const emailRules = workflowRules.filter(rule => rule.type === 'email_automation');

  const handleSaveRule = async () => {
    if (!user) return;
    
    try {
      const ruleData = {
        ...newRule,
        created_by: user.id
      };
      
      if (editingRule) {
        await updateWorkflowRule(editingRule.id, ruleData);
        toast({
          title: "Rule Updated",
          description: "Email automation rule has been updated successfully.",
        });
      } else {
        await createWorkflowRule(ruleData);
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

  const addCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        field: 'status',
        operator: 'equals',
        value: '',
        logic: 'and'
      }]
    }));
  };

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [...prev.actions, {
        type: 'send_email',
        parameters: {
          subject: '',
          content: '',
          delay_hours: 0
        }
      }]
    }));
  };

  const updateCondition = (index: number, field: keyof WorkflowCondition, value: any) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { 
          ...action, 
          parameters: { ...action.parameters, [field]: value }
        } : action
      )
    }));
  };

  const openEditDialog = (rule: WorkflowRule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      type: 'email_automation',
      conditions: rule.conditions,
      actions: rule.actions,
      is_active: rule.is_active,
      priority: rule.priority
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Email Automation
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Email Rule' : 'Create Email Rule'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Rule Name</Label>
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
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Trigger Conditions</h4>
                      <Button variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Condition
                      </Button>
                    </div>
                    {newRule.conditions.map((condition, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(index, 'field', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="kyc_status">KYC Status</SelectItem>
                            <SelectItem value="balance">Balance</SelectItem>
                            <SelectItem value="registration_date">Registration Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
                          placeholder="Value"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewRule(prev => ({
                              ...prev,
                              conditions: prev.conditions.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Email Actions</h4>
                      <Button variant="outline" size="sm" onClick={addAction}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Email
                      </Button>
                    </div>
                    {newRule.actions.map((action, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium">Email {index + 1}</h5>
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
                            <Label>Subject</Label>
                            <Input
                              value={action.parameters.subject || ''}
                              onChange={(e) => updateAction(index, 'subject', e.target.value)}
                              placeholder="Welcome to our platform!"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Delay (hours)</Label>
                            <Input
                              type="number"
                              value={action.parameters.delay_hours || 0}
                              onChange={(e) => updateAction(index, 'delay_hours', parseInt(e.target.value))}
                              min="0"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Email Content</Label>
                          <Textarea
                            value={action.parameters.content || ''}
                            onChange={(e) => updateAction(index, 'content', e.target.value)}
                            placeholder="Dear {first_name}, welcome to our platform..."
                            rows={4}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleSaveRule} className="w-full" disabled={isLoading}>
                    {editingRule ? 'Update Rule' : 'Create Rule'}
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
                      <Badge variant="outline">Priority: {rule.priority}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {rule.conditions.length} condition(s), {rule.actions.length} email(s)
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(rule)}
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
                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No email automation rules configured</p>
                <p className="text-sm text-gray-400">Create your first rule to automate email communications</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAutomation;
