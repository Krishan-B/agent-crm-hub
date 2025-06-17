
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Mail, Edit, Trash2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  format: string;
  recipients: string[];
  next_run: string;
  is_active: boolean;
  last_run?: string;
}

const MOCK_REPORTS: ScheduledReport[] = [
  {
    id: '1',
    name: 'Weekly Lead Summary',
    frequency: 'weekly',
    format: 'PDF',
    recipients: ['admin@example.com', 'manager@example.com'],
    next_run: '2024-01-15T09:00:00Z',
    is_active: true,
    last_run: '2024-01-08T09:00:00Z'
  },
  {
    id: '2',
    name: 'Monthly Revenue Report',
    frequency: 'monthly',
    format: 'Excel',
    recipients: ['finance@example.com'],
    next_run: '2024-02-01T08:00:00Z',
    is_active: true
  }
];

const ScheduledReports: React.FC = () => {
  const [reports, setReports] = useState<ScheduledReport[]>(MOCK_REPORTS);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly',
    format: 'PDF',
    recipients: '',
    time: '09:00'
  });
  const { toast } = useToast();

  const handleCreateReport = () => {
    if (!formData.name || !formData.recipients) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newReport: ScheduledReport = {
      id: `report_${Date.now()}`,
      name: formData.name,
      frequency: formData.frequency,
      format: formData.format,
      recipients: formData.recipients.split(',').map(email => email.trim()),
      next_run: new Date().toISOString(),
      is_active: true
    };

    setReports([...reports, newReport]);
    setIsCreating(false);
    setFormData({
      name: '',
      frequency: 'weekly',
      format: 'PDF',
      recipients: '',
      time: '09:00'
    });

    toast({
      title: "Report Scheduled",
      description: `"${formData.name}" has been scheduled successfully.`,
    });
  };

  const toggleReportStatus = (id: string) => {
    setReports(reports.map(report => 
      report.id === id 
        ? { ...report, is_active: !report.is_active }
        : report
    ));
  };

  const deleteReport = (id: string) => {
    setReports(reports.filter(report => report.id !== id));
    toast({
      title: "Report Deleted",
      description: "Scheduled report has been deleted.",
    });
  };

  const runReportNow = (id: string) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      toast({
        title: "Report Triggered",
        description: `"${report.name}" is being generated and will be sent to recipients.`,
      });
    }
  };

  const formatFrequency = (frequency: string) => {
    const frequencies: { [key: string]: string } = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly'
    };
    return frequencies[frequency] || frequency;
  };

  const formatNextRun = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          <p className="text-sm text-gray-600">
            Automate report generation and delivery
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {isCreating && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Schedule New Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Sales Report"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Format</Label>
                <Select 
                  value={formData.format} 
                  onValueChange={(value) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
              <Input
                id="recipients"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="admin@company.com, manager@company.com"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateReport}>
                Schedule Report
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{report.name}</h4>
                    <Badge variant={report.is_active ? "default" : "secondary"}>
                      {report.is_active ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline">
                      {formatFrequency(report.frequency)}
                    </Badge>
                    <Badge variant="outline">
                      {report.format}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Next run: {formatNextRun(report.next_run)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {report.recipients.length} recipient(s)
                    </span>
                  </div>

                  {report.last_run && (
                    <p className="text-xs text-gray-500">
                      Last run: {formatNextRun(report.last_run)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {report.recipients.map((email, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => runReportNow(report.id)}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleReportStatus(report.id)}
                  >
                    {report.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteReport(report.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h3>
              <p className="text-gray-500 mb-4">
                Create your first scheduled report to automate data delivery.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                Schedule Your First Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScheduledReports;
