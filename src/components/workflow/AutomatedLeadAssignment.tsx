
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWorkflowAutomation } from '../../hooks/useWorkflowAutomation';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import type { WorkflowRule, WorkflowCondition, WorkflowAction } from '../../types/workflow';

const AutomatedLeadAssignment: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'lead_assignment' as const,
    conditions: [] as WorkflowCondition[],
    actions: [] as WorkflowAction[],
    is_active: true,
    priority: 1
  });

  const { workflowRules, createWorkflowRule, updateWorkflowRule, deleteWorkflowRule, isLoading } = useWorkflowAutomation();
  const { profiles } = useProfile();
  const { toast } = useToast();

  const assignmentRules = workflowRules.filter(rule => rule.type === 'lead_assignment');

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await updateWorkflowRule(editingRule.id, newRule);
        toast({
          title: "Rule Updated",
          description: "Assignment rule has been updated successfully.",
        });
      } else {
        await createWorkflowRule(newRule);
        toast({
          title: "Rule Created",
          description: "New assignment rule has been created successfully.",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save assignment rule.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteWorkflowRule(id);
      toast({
        title: "Rule Deleted",
        description: "Assignment rule has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assignment rule.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewRule({
      name: '',
      type: 'lead_assignment',
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
        field: 'country',
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
        type: 'assign_agent',
        parameters: { strategy: 'round_robin' }
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
      type: rule.type,
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
              <Users className="h-5 w-5 mr-2" />
              Automated Lead Assignment
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
                    {editingRule ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
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
                        placeholder="Enter rule name"
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
                      <h4 className="font-medium">Conditions</h4>
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
                            <SelectItem value="country">Country</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="balance">Balance</SelectItem>
                            <SelectItem value="kyc_status">KYC Status</SelectItem>
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
                            <SelectItem value="contains">Contains</SelectItem>
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
                      <h4 className="font-medium">Actions</h4>
                      <Button variant="outline" size="sm" onClick={addAction}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Action
                      </Button>
                    </div>
                    {newRule.actions.map((action, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 p-3 border rounded-lg">
                        <Select
                          value={action.parameters.strategy || 'round_robin'}
                          onValueChange={(value) => updateAction(index, 'strategy', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="round_robin">Round Robin</SelectItem>
                            <SelectItem value="workload_based">Workload Based</SelectItem>
                            <SelectItem value="specific_agent">Specific Agent</SelectItem>
                          </SelectContent>
                        </Select>
                        {action.parameters.strategy === 'specific_agent' && (
                          <Select
                            value={action.parameters.agent_id || ''}
                            onValueChange={(value) => updateAction(index, 'agent_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.filter(p => p.role === 'agent').map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.first_name} {agent.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
            {assignmentRules.map((rule) => (
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
                      {rule.conditions.length} condition(s), {rule.actions.length} action(s)
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
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {assignmentRules.length === 0 && (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assignment rules configured</p>
                <p className="text-sm text-gray-400">Create your first rule to automate lead assignment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedLeadAssignment;
