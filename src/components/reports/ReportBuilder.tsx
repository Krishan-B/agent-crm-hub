
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Download, Eye, Save, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

const AVAILABLE_FIELDS: ReportField[] = [
  { name: 'first_name', label: 'First Name', type: 'text' },
  { name: 'last_name', label: 'Last Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'country', label: 'Country', type: 'text' },
  { name: 'status', label: 'Status', type: 'text' },
  { name: 'balance', label: 'Balance', type: 'number' },
  { name: 'bonus_amount', label: 'Bonus Amount', type: 'number' },
  { name: 'kyc_status', label: 'KYC Status', type: 'text' },
  { name: 'created_at', label: 'Created Date', type: 'date' },
  { name: 'updated_at', label: 'Updated Date', type: 'date' },
  { name: 'assigned_agent_id', label: 'Assigned Agent', type: 'text' }
];

const ReportBuilder: React.FC = () => {
  const [reportName, setReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const toggleField = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const generateReport = async () => {
    if (!reportName || selectedFields.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a report name and select at least one field.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report Generated",
        description: `Report "${reportName}" has been generated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const previewReport = () => {
    toast({
      title: "Preview",
      description: "Report preview feature will be available soon.",
    });
  };

  const saveTemplate = () => {
    if (!reportName) {
      toast({
        title: "Validation Error",
        description: "Please provide a report name to save as template.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Template Saved",
      description: `Report template "${reportName}" has been saved.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Name */}
          <div>
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name..."
            />
          </div>

          {/* Field Selection */}
          <div>
            <Label className="text-base font-medium">Select Fields</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {AVAILABLE_FIELDS.map((field) => (
                <div key={field.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={selectedFields.includes(field.name)}
                    onCheckedChange={() => toggleField(field.name)}
                  />
                  <Label htmlFor={field.name} className="text-sm">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedFields.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedFields.map((fieldName) => {
                  const field = AVAILABLE_FIELDS.find(f => f.name === fieldName);
                  return (
                    <Badge key={fieldName} variant="secondary" className="flex items-center gap-1">
                      {field?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleField(fieldName)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filters */}
          <div>
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Filters</Label>
              <Button size="sm" variant="outline" onClick={addFilter}>
                <Plus className="h-3 w-3 mr-1" />
                Add Filter
              </Button>
            </div>
            
            {filters.map((filter, index) => (
              <div key={index} className="flex gap-2 items-center mt-2">
                <Select 
                  value={filter.field} 
                  onValueChange={(value) => updateFilter(index, 'field', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS.map((field) => (
                      <SelectItem key={field.name} value={field.name}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filter.operator} 
                  onValueChange={(value) => updateFilter(index, 'operator', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />

                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeFilter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Grouping and Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {AVAILABLE_FIELDS.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FIELDS.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={saveTemplate}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
        <Button variant="outline" onClick={previewReport}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={generateReport} disabled={isGenerating}>
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReportBuilder;
