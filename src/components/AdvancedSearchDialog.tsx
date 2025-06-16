
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { useAdvancedSearch, SearchFilters } from '../hooks/useAdvancedSearch';
import { useLeadTags } from '../hooks/useLeadTags';
import { useToast } from '@/hooks/use-toast';

interface AdvancedSearchDialogProps {
  onResults: (results: any[]) => void;
  trigger?: React.ReactNode;
}

const AdvancedSearchDialog: React.FC<AdvancedSearchDialogProps> = ({
  onResults,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const { results, isLoading, search } = useAdvancedSearch();
  const { tags } = useLeadTags();
  const { toast } = useToast();

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'kyc_pending', label: 'KYC Pending' },
    { value: 'kyc_approved', label: 'KYC Approved' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  const kycStatusOptions = [
    { value: 'not_submitted', label: 'Not Submitted' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const handleSearch = async () => {
    await search(filters);
    toast({
      title: "Search Complete",
      description: `Found ${results.length} matching leads.`,
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'status' | 'kycStatus' | 'countries' | 'tags', value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  useEffect(() => {
    onResults(results);
  }, [results, onResults]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Search
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Lead Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Text Search */}
          <div>
            <Label htmlFor="query">Search Query</Label>
            <Input
              id="query"
              value={filters.query || ''}
              onChange={(e) => updateFilter('query', e.target.value)}
              placeholder="Search by name, email, phone, or country..."
            />
          </div>

          {/* Status Filters */}
          <div>
            <Label>Lead Status</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={filters.status?.includes(option.value) || false}
                    onCheckedChange={() => toggleArrayFilter('status', option.value)}
                  />
                  <Label htmlFor={`status-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* KYC Status Filters */}
          <div>
            <Label>KYC Status</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {kycStatusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`kyc-${option.value}`}
                    checked={filters.kycStatus?.includes(option.value) || false}
                    onCheckedChange={() => toggleArrayFilter('kycStatus', option.value)}
                  />
                  <Label htmlFor={`kyc-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('tags', tag.id)}
                  style={{
                    backgroundColor: filters.tags?.includes(tag.id) ? tag.color : 'transparent',
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">Registration From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateRange?.from || ''}
                onChange={(e) => updateFilter('dateRange', { 
                  ...filters.dateRange, 
                  from: e.target.value 
                })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Registration To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateRange?.to || ''}
                onChange={(e) => updateFilter('dateRange', { 
                  ...filters.dateRange, 
                  to: e.target.value 
                })}
              />
            </div>
          </div>

          {/* Balance Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="balanceMin">Min Balance</Label>
              <Input
                id="balanceMin"
                type="number"
                value={filters.balanceRange?.min || ''}
                onChange={(e) => updateFilter('balanceRange', { 
                  ...filters.balanceRange, 
                  min: Number(e.target.value) 
                })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="balanceMax">Max Balance</Label>
              <Input
                id="balanceMax"
                type="number"
                value={filters.balanceRange?.max || ''}
                onChange={(e) => updateFilter('balanceRange', { 
                  ...filters.balanceRange, 
                  max: Number(e.target.value) 
                })}
                placeholder="10000"
              />
            </div>
          </div>

          {/* Additional Filters */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasActivity"
                checked={filters.hasActivity || false}
                onCheckedChange={(checked) => updateFilter('hasActivity', checked)}
              />
              <Label htmlFor="hasActivity">Has activity in last 30 days</Label>
            </div>
            
            <div>
              <Label htmlFor="lastContact">No contact in days</Label>
              <Input
                id="lastContact"
                type="number"
                value={filters.lastContactDays || ''}
                onChange={(e) => updateFilter('lastContactDays', Number(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedSearchDialog;
