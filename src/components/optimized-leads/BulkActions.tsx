
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BulkActionsProps {
  selectedCount: number;
  bulkActionType: string;
  setBulkActionType: (type: string) => void;
  onApplyBulkAction: () => void;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  bulkActionType,
  setBulkActionType,
  onApplyBulkAction,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} lead(s) selected
      </span>
      <div className="flex gap-2">
        <Select value={bulkActionType} onValueChange={setBulkActionType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Bulk Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assign">Assign Agent</SelectItem>
            <SelectItem value="status_change">Change Status</SelectItem>
            <SelectItem value="export">Export Selected</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onApplyBulkAction} disabled={!bulkActionType}>
          Apply
        </Button>
        <Button variant="outline" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
};
