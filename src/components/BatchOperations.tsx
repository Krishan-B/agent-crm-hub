
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, Loader2, CheckSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEdgeFunctions } from '../hooks/useEdgeFunctions';
import { useLeads } from '../hooks/useLeads';

const BatchOperations: React.FC = () => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [operation, setOperation] = useState('');
  const [operationData, setOperationData] = useState<any>({});
  const { leads } = useLeads();
  const { executeBatchOperation, isLoading } = useEdgeFunctions();
  const { toast } = useToast();

  const handleLeadSelection = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleExecuteOperation = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead",
        variant: "destructive",
      });
      return;
    }

    if (!operation) {
      toast({
        title: "No operation selected",
        description: "Please select an operation to perform",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await executeBatchOperation(operation, selectedLeads, operationData);
      
      toast({
        title: "Batch Operation Completed",
        description: `Successfully processed ${result.results.length} leads. ${result.errors.length} errors.`,
      });

      // Reset selections
      setSelectedLeads([]);
      setOperation('');
      setOperationData({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute batch operation",
        variant: "destructive",
      });
    }
  };

  const renderOperationInputs = () => {
    switch (operation) {
      case 'update_status':
        return (
          <Select 
            value={operationData.status || ''} 
            onValueChange={(value) => setOperationData({ ...operationData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="kyc_pending">KYC Pending</SelectItem>
              <SelectItem value="kyc_approved">KYC Approved</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'assign_agent':
        return (
          <Input
            placeholder="Agent ID"
            value={operationData.agentId || ''}
            onChange={(e) => setOperationData({ ...operationData, agentId: e.target.value })}
          />
        );

      case 'add_tag':
        return (
          <Input
            placeholder="Tag name"
            value={operationData.tag || ''}
            onChange={(e) => setOperationData({ ...operationData, tag: e.target.value })}
          />
        );

      case 'add_comment':
        return (
          <Textarea
            placeholder="Comment to add to all selected leads"
            value={operationData.comment || ''}
            onChange={(e) => setOperationData({ ...operationData, comment: e.target.value })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Batch Operations
          </CardTitle>
          <CardDescription>
            Perform operations on multiple leads at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Operation Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Operation</label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_status">Update Status</SelectItem>
                <SelectItem value="assign_agent">Assign Agent</SelectItem>
                <SelectItem value="add_tag">Add Tag</SelectItem>
                <SelectItem value="add_comment">Add Comment</SelectItem>
                <SelectItem value="export_data">Export Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operation-specific inputs */}
          {operation && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation Details</label>
              {renderOperationInputs()}
            </div>
          )}

          {/* Lead Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Select Leads</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Select All ({leads.length})
                </label>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lead-${lead.id}`}
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                  />
                  <label htmlFor={`lead-${lead.id}`} className="flex-1 text-sm cursor-pointer">
                    {lead.first_name} {lead.last_name} ({lead.email})
                  </label>
                  <Badge variant="outline">{lead.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Count and Execute Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedLeads.length} lead(s) selected
            </div>
            <Button 
              onClick={handleExecuteOperation} 
              disabled={isLoading || selectedLeads.length === 0 || !operation}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Execute Operation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchOperations;
