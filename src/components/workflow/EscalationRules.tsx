
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, AlertTriangle, Clock, Users } from 'lucide-react';
import { useEscalationRules } from '../../hooks/useEscalationRules';
import { useToast } from '@/hooks/use-toast';

const EscalationRules: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_condition: '',
    escalation_levels: [],
    is_active: true
  });

  const { escalationRules, createEscalationRule, fetchEscalationRules, isLoading, error } = useEscalationRules();
  const { toast } = useToast();

  useEffect(() => {
    fetchEscalationRules();
  }, []);

  const handleCreateRule = async () => {
    try {
      await createEscalationRule(formData);
      setIsCreating(false);
      setFormData({
        name: '',
        trigger_condition: '',
        escalation_levels: [],
        is_active: true
      });
      toast({
        title: "Escalation Rule Created",
        description: "The escalation rule has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create escalation rule.",
        variant: "destructive",
      });
    }
  };

  const addEscalationLevel = () => {
    const newLevel = {
      level: formData.escalation_levels.length + 1,
      delay_hours: 24,
      action: 'email_notification',
      recipients: [],
      message_template: ''
    };
    setFormData({
      ...formData,
      escalation_levels: [...formData.escalation_levels, newLevel]
    });
  };

  const updateEscalationLevel = (index: number, field: string, value: any) => {
    const updatedLevels = [...formData.escalation_levels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setFormData({
      ...formData,
      escalation_levels: updatedLevels
    });
  };

  const removeEscalationLevel = (index: number) => {
    const updatedLevels = formData.escalation_levels.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      escalation_levels: updatedLevels
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Escalation Rules</h3>
          <p className="text-sm text-gray-600">
            Automatically escalate leads based on inactivity or other conditions
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {isCreating && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Create Escalation Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., No Contact for 48 Hours"
                />
              </div>
              <div>
                <Label htmlFor="trigger">Trigger Condition</Label>
                <Select 
                  value={formData.trigger_condition} 
                  onValueChange={(value) => setFormData({ ...formData, trigger_condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_contact_24h">No contact for 24 hours</SelectItem>
                    <SelectItem value="no_contact_48h">No contact for 48 hours</SelectItem>
                    <SelectItem value="no_contact_72h">No contact for 72 hours</SelectItem>
                    <SelectItem value="high_value_inactive">High-value lead inactive</SelectItem>
                    <SelectItem value="kyc_pending_long">KYC pending for too long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Escalation Levels</Label>
                <Button size="sm" variant="outline" onClick={addEscalationLevel}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Level
                </Button>
              </div>

              {formData.escalation_levels.map((level: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Level {level.level}</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeEscalationLevel(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Delay (hours)</Label>
                      <Input
                        type="number"
                        value={level.delay_hours}
                        onChange={(e) => updateEscalationLevel(index, 'delay_hours', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Action</Label>
                      <Select 
                        value={level.action} 
                        onValueChange={(value) => updateEscalationLevel(index, 'action', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email_notification">Email Notification</SelectItem>
                          <SelectItem value="sms_notification">SMS Notification</SelectItem>
                          <SelectItem value="reassign_lead">Reassign Lead</SelectItem>
                          <SelectItem value="create_task">Create Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Recipients</Label>
                      <Input
                        placeholder="Enter email addresses"
                        value={level.recipients.join(', ')}
                        onChange={(e) => updateEscalationLevel(index, 'recipients', e.target.value.split(', '))}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.escalation_levels.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Add at least one escalation level to define what happens when the rule triggers.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Rule is active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRule} disabled={!formData.name || !formData.trigger_condition}>
                Create Rule
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {escalationRules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Trigger: {rule.trigger_condition.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rule.escalation_levels.length} levels
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Multiple recipients
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {rule.escalation_levels.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2 flex-wrap">
                    {rule.escalation_levels.map((level: any, index: number) => (
                      <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Level {level.level}: {level.action} after {level.delay_hours}h
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {escalationRules.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Escalation Rules</h3>
              <p className="text-gray-500 mb-4">
                Create escalation rules to automatically handle leads that need attention.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscalationRules;
