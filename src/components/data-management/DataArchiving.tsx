
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Archive, Trash2, RefreshCw, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DataArchiving: React.FC = () => {
  const [archivePeriod, setArchivePeriod] = useState('6');
  const [deletePeriod, setDeletePeriod] = useState('24');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleArchiveOldLeads = async () => {
    setIsProcessing(true);
    try {
      // Simulate archiving process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Archive Complete",
        description: `Leads older than ${archivePeriod} months have been archived.`,
      });
    } catch (error) {
      toast({
        title: "Archive Failed",
        description: "Failed to archive leads.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteArchivedLeads = async () => {
    setIsProcessing(true);
    try {
      // Simulate deletion process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Deletion Complete",
        description: `Archived leads older than ${deletePeriod} months have been permanently deleted.`,
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete archived leads.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Old Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Archive leads that haven't been active for a specified period. Archived leads can be restored if needed.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Archive leads older than:</label>
              <Select value={archivePeriod} onValueChange={setArchivePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleArchiveOldLeads}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Archiving...' : 'Archive Old Leads'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Archived Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <Trash2 className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Permanently delete archived leads. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Delete archived leads older than:</label>
              <Select value={deletePeriod} onValueChange={setDeletePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                  <SelectItem value="60">60 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleDeleteArchivedLeads}
                disabled={isProcessing}
                variant="destructive"
                className="w-full"
              >
                {isProcessing ? 'Deleting...' : 'Delete Archived Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Data Retention Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Active Data</h4>
                <p className="text-gray-600">Kept indefinitely until archived</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Archived Data</h4>
                <p className="text-gray-600">Retained for compliance period</p>
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                Configure automatic archiving and deletion policies in your organization settings.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
