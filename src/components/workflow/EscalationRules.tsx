
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, AlertTriangle, ArrowUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWorkflowAutomation } from '../../hooks/useWorkflowAutomation';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import type { EscalationRule, EscalationLevel } from '../../types/workflow';

const EscalationRules: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger_condition: '',
    escalation_levels: [] as EscalationLevel[],
    is_active: true
  });

  const { escalationRules, createEscalationRule, isLoading } = useWorkflowAutomation();
  const { profiles } = useProfile();
  const { toast } = useToast();

  const managers = profiles.filter(p => p.role === 'manager' || p.role === 'admin');

  const handleSaveRule = async () => {
    try {
      await createEscalationRule(newRule);
      toast({
        title: "Escalation Rule Created",
        description: "New escalation rule has been created successfully.",
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create escalation rule.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewRule({
      name: '',
      trigger_condition: '',
      escalation_levels: [],
      is_active: true
    });
    setEditingRule(null);
  };

  const addEscalationLevel = () => {
    setNewRule(prev => ({
      ...prev,
      escalation_levels: [
        ...prev.escalation_levels,
        {
          level: prev.escalation_levels.length + 1,
          delay_hours: 24,
          escalate_to: [],
          action_type: 'notify',
          message_template: ''
        }
      ]
    }));
  };

  const updateEscalationLevel = (index: number, field: keyof EscalationLevel, value: any) => {
    setNewRule(prev => ({
      ...prev,
      escalation_levels: prev.escalation_levels.map((level, i) =>
        i === index ? { ...level, [field]: value } : level
      )
    }));
  };

  const removeEscalationLevel = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      escalation_levels: prev.escalation_levels.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Escalation Rules
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
                  <DialogTitle>Create Escalation Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Unresponsive Lead Escalation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trigger">Trigger Condition</Label>
                    <Select
                      value={newRule.trigger_condition}
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger_condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_contact_24h">No contact for 24 hours</SelectItem>
                        <SelectItem value="no_contact_48h">No contact for 48 hours</SelectItem>
                        <SelectItem value="no_contact_72h">No contact for 72 hours</SelectItem>
                        <SelectItem value="overdue_kyc">KYC overdue</SelectItem>
                        <SelectItem value="high_value_inactive">High value lead inactive</SelectItem>
                        <SelectItem value="complaint_unresolved">Complaint unresolved</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <h4 className="font-medium">Escalation Levels</h4>
                      <Button variant="outline" size="sm" onClick={addEscalationLevel}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Level
                      </Button>
                    </div>

                    {newRule.escalation_levels.map((level, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium flex items-center">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Level {level.level}
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEscalationLevel(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Delay (hours)</Label>
                            <Input
                              type="number"
                              value={level.delay_hours}
                              onChange={(e) => updateEscalationLevel(index, 'delay_hours', parseInt(e.target.value))}
                              min="1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Action Type</Label>
                            <Select
                              value={level.action_type}
                              onValueChange={(value: any) => updateEscalationLevel(index, 'action_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="notify">Notify Manager</SelectItem>
                                <SelectItem value="reassign">Reassign Lead</SelectItem>
                                <SelectItem value="create_task">Create Task</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Escalate To</Label>
                          <Select
                            value={level.escalate_to[0] || ''}
                            onValueChange={(value) => updateEscalationLevel(index, 'escalate_to', [value])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.first_name} {manager.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Message Template</Label>
                          <Textarea
                            value={level.message_template || ''}
                            onChange={(e) => updateEscalationLevel(index, 'message_template', e.target.value)}
                            placeholder="Lead {lead_name} requires attention..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}

                    {newRule.escalation_levels.length === 0 && (
                      <div className="text-center py-8 border rounded-lg border-dashed">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No escalation levels defined</p>
                        <p className="text-sm text-gray-400">Add escalation levels to define the workflow</p>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSaveRule} className="w-full" disabled={isLoading}>
                    Create Escalation Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {escalationRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {rule.escalation_levels.length} level(s)
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Trigger: {rule.trigger_condition.replace('_', ' ')}
                    </p>
                    <div className="flex space-x-2">
                      {rule.escalation_levels.map((level) => (
                        <Badge key={level.level} variant="outline" className="text-xs">
                          L{level.level}: {level.delay_hours}h
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {escalationRules.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No escalation rules configured</p>
                <p className="text-sm text-gray-400">Create rules to automatically escalate important issues</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EscalationRules;
