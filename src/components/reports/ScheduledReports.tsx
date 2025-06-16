
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Plus, Edit, Trash2, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  format: string;
  frequency: string;
  recipients: string[];
  is_active: boolean;
  next_run: string;
  last_run?: string;
  created_at: string;
}

const ScheduledReports: React.FC = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: 'leads',
    format: 'pdf',
    frequency: 'weekly',
    recipients: [''],
    is_active: true
  });
  const { user } = useAuth();
  
  useEffect(() => {
    fetchScheduledReports();
  }, [user]);
  
  const fetchScheduledReports = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching scheduled reports:', error);
        return;
      }
      
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      setReports([]);
    }
  };
  
  const saveReport = async () => {
    if (!user) return;
    
    try {
      const reportData = {
        ...newReport,
        recipients: newReport.recipients.filter(email => email.trim() !== ''),
        created_by: user.id,
        next_run: calculateNextRun(newReport.frequency)
      };
      
      if (editingReport) {
        const { error } = await supabase
          .from('scheduled_reports')
          .update(reportData)
          .eq('id', editingReport.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('scheduled_reports')
          .insert([reportData]);
        
        if (error) throw error;
      }
      
      setIsDialogOpen(false);
      setEditingReport(null);
      setNewReport({
        name: '',
        report_type: 'leads',
        format: 'pdf',
        frequency: 'weekly',
        recipients: [''],
        is_active: true
      });
      fetchScheduledReports();
    } catch (error) {
      console.error('Error saving scheduled report:', error);
    }
  };
  
  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchScheduledReports();
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
    }
  };
  
  const toggleReportStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      fetchScheduledReports();
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };
  
  const calculateNextRun = (frequency: string): string => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
  };
  
  const openEditDialog = (report: ScheduledReport) => {
    setEditingReport(report);
    setNewReport({
      name: report.name,
      report_type: report.report_type,
      format: report.format,
      frequency: report.frequency,
      recipients: report.recipients,
      is_active: report.is_active
    });
    setIsDialogOpen(true);
  };
  
  const addRecipient = () => {
    setNewReport(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };
  
  const updateRecipient = (index: number, email: string) => {
    setNewReport(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => i === index ? email : recipient)
    }));
  };
  
  const removeRecipient = (index: number) => {
    setNewReport(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Scheduled Reports</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      value={newReport.name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Monthly Lead Report"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="report_type">Report Type</Label>
                    <Select value={newReport.report_type} onValueChange={(value) => setNewReport(prev => ({ ...prev, report_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leads">Leads Report</SelectItem>
                        <SelectItem value="analytics">Analytics Report</SelectItem>
                        <SelectItem value="financial">Financial Report</SelectItem>
                        <SelectItem value="performance">Performance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select value={newReport.format} onValueChange={(value) => setNewReport(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newReport.frequency} onValueChange={(value) => setNewReport(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    {newReport.recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={recipient}
                          onChange={(e) => updateRecipient(index, e.target.value)}
                          placeholder="email@example.com"
                          type="email"
                        />
                        {newReport.recipients.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeRecipient(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addRecipient}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newReport.is_active}
                      onCheckedChange={(checked) => setNewReport(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                  
                  <Button onClick={saveReport} className="w-full">
                    {editingReport ? 'Update Report' : 'Schedule Report'}
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
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.report_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {report.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Mail className="h-3 w-3 mr-1" />
                      {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={report.is_active}
                      onCheckedChange={(checked) => toggleReportStatus(report.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(report.next_run).toLocaleDateString()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(report)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {reports.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No scheduled reports found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledReports;
