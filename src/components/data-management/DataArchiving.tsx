
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar, DateRange } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Archive, Trash2, Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDataArchiving } from '../../hooks/useDataArchiving';

export const DataArchiving: React.FC = () => {
  const [archiveRule, setArchiveRule] = useState<'age' | 'status' | 'manual'>('age');
  const [ageDays, setAgeDays] = useState('365');
  const [statusToArchive, setStatusToArchive] = useState('inactive');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState(0);
  const { toast } = useToast();

  const {
    archiveLeads,
    restoreLeads,
    deleteArchivedLeads,
    getArchiveStatistics,
    archiveStats
  } = useDataArchiving();

  const handleArchive = async () => {
    setIsArchiving(true);
    setArchiveProgress(0);

    try {
      let criteria: any = {};

      switch (archiveRule) {
        case 'age':
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(ageDays));
          criteria.olderThan = cutoffDate;
          break;
        case 'status':
          criteria.status = statusToArchive;
          break;
        case 'manual':
          if (dateRange?.from && dateRange?.to) {
            criteria.dateRange = dateRange;
          }
          break;
      }

      setArchiveProgress(25);

      const result = await archiveLeads(criteria);

      setArchiveProgress(100);

      toast({
        title: "Archive completed",
        description: `Successfully archived ${result.archived} leads.`,
      });

      // Refresh statistics
      await getArchiveStatistics();

    } catch (error) {
      console.error('Archive error:', error);
      toast({
        title: "Archive failed",
        description: "An error occurred during archiving.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
      setTimeout(() => setArchiveProgress(0), 2000);
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restoreLeads({});
      
      toast({
        title: "Restore completed",
        description: `Successfully restored ${result.restored} leads.`,
      });

      await getArchiveStatistics();
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore failed",
        description: "An error occurred during restore.",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirm('This will permanently delete all archived data. This action cannot be undone. Are you sure?')) {
      return;
    }

    try {
      const result = await deleteArchivedLeads();
      
      toast({
        title: "Deletion completed",
        description: `Successfully deleted ${result.deleted} archived leads.`,
      });

      await getArchiveStatistics();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Deletion failed",
        description: "An error occurred during deletion.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    getArchiveStatistics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Archive Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archiveStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{archiveStats.totalLeads}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{archiveStats.activeLeads}</div>
                <div className="text-sm text-gray-500">Active Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{archiveStats.archivedLeads}</div>
                <div className="text-sm text-gray-500">Archived Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {((archiveStats.activeLeads / archiveStats.totalLeads) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Active Ratio</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Archive Rule</label>
            <Select value={archiveRule} onValueChange={(value: any) => setArchiveRule(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="age">By Age</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="manual">Manual Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {archiveRule === 'age' && (
            <div>
              <label className="block text-sm font-medium mb-2">Archive leads older than (days)</label>
              <Input
                type="number"
                value={ageDays}
                onChange={(e) => setAgeDays(e.target.value)}
                placeholder="365"
                min="1"
              />
            </div>
          )}

          {archiveRule === 'status' && (
            <div>
              <label className="block text-sm font-medium mb-2">Status to archive</label>
              <Select value={statusToArchive} onValueChange={setStatusToArchive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {archiveRule === 'manual' && (
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {isArchiving && (
            <div>
              <Progress value={archiveProgress} className="mb-2" />
              <p className="text-sm text-gray-500">Archiving... {archiveProgress}%</p>
            </div>
          )}

          <Button 
            onClick={handleArchive} 
            disabled={isArchiving}
            className="w-full"
          >
            {isArchiving ? 'Archiving...' : 'Archive Leads'}
          </Button>

          <Alert>
            <Archive className="h-4 w-4" />
            <AlertDescription>
              Archived leads will be moved to long-term storage but can be restored if needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Archive Management */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleRestore} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Restore All Archived
            </Button>
            
            <Button 
              onClick={handlePermanentDelete} 
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Permanently Delete
            </Button>
            
            <Button 
              onClick={() => {/* Export archived data */}} 
              variant="outline"
              className="w-full"
            >
              <Archive className="mr-2 h-4 w-4" />
              Export Archived
            </Button>
          </div>

          <Alert>
            <Trash2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Permanent deletion cannot be undone. Make sure to export archived data before deletion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
