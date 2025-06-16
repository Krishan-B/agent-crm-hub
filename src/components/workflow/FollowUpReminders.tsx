
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Clock, CheckCircle, AlertCircle, CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useWorkflowAutomation } from '../../hooks/useWorkflowAutomation';
import { useLeads } from '../../hooks/useLeads';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FollowUpReminders: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    lead_id: '',
    assigned_to: '',
    reminder_type: 'call' as const,
    title: '',
    description: '',
    due_date: new Date(),
    priority: 'medium' as const
  });

  const { reminders, createFollowUpReminder, completeReminder, isLoading } = useWorkflowAutomation();
  const { leads } = useLeads();
  const { profiles } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateReminder = async () => {
    if (!user) return;
    
    try {
      await createFollowUpReminder({
        ...newReminder,
        due_date: newReminder.due_date.toISOString(),
        status: 'pending',
        created_by: user.id
      });
      
      toast({
        title: "Reminder Created",
        description: "Follow-up reminder has been created successfully.",
      });
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create reminder.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await completeReminder(id);
      toast({
        title: "Reminder Completed",
        description: "Follow-up reminder has been marked as completed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete reminder.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewReminder({
      lead_id: '',
      assigned_to: '',
      reminder_type: 'call',
      title: '',
      description: '',
      due_date: new Date(),
      priority: 'medium'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'email': return '📧';
      case 'meeting': return '🤝';
      default: return '📝';
    }
  };

  const sortedReminders = reminders.sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Follow-up Reminders
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Follow-up Reminder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead">Lead</Label>
                    <Select value={newReminder.lead_id} onValueChange={(value) => setNewReminder(prev => ({ ...prev, lead_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.first_name} {lead.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Select value={newReminder.assigned_to} onValueChange={(value) => setNewReminder(prev => ({ ...prev, assigned_to: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.filter(p => p.role === 'agent').map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.first_name} {agent.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={newReminder.reminder_type} onValueChange={(value: any) => setNewReminder(prev => ({ ...prev, reminder_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newReminder.priority} onValueChange={(value: any) => setNewReminder(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Follow up on proposal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newReminder.description}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newReminder.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newReminder.due_date ? format(newReminder.due_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newReminder.due_date}
                          onSelect={(date) => date && setNewReminder(prev => ({ ...prev, due_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button onClick={handleCreateReminder} className="w-full" disabled={isLoading}>
                    Create Reminder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedReminders.map((reminder: any) => (
              <div key={reminder.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(reminder.reminder_type)}</span>
                      <h3 className="font-medium">{reminder.title}</h3>
                      <Badge className={getPriorityColor(reminder.priority)}>
                        {reminder.priority}
                      </Badge>
                      <Badge className={getStatusColor(reminder.status)}>
                        {reminder.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Lead: {reminder.lead?.first_name} {reminder.lead?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Assigned to: {reminder.assigned_user?.first_name} {reminder.assigned_user?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Due: {format(new Date(reminder.due_date), "PPP")}
                    </p>
                    {reminder.description && (
                      <p className="text-sm text-gray-500">{reminder.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {reminder.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteReminder(reminder.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {reminder.status === 'overdue' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No follow-up reminders</p>
                <p className="text-sm text-gray-400">Create reminders to stay on top of your leads</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpReminders;
