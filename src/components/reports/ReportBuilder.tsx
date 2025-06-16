
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, FileText, Table, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ReportConfig, ReportData, reportService } from '../../services/reportService';
import { useOptimizedLeads } from '../../hooks/useOptimizedLeads';
import { useAnalytics } from '../../hooks/useAnalytics';

const ReportBuilder: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    type: 'leads',
    format: 'pdf',
    dateRange: {
      from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      to: new Date()
    },
    includeCharts: false,
    customFields: []
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  
  const { leads } = useOptimizedLeads();
  const { snapshots } = useAnalytics();
  
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare data based on config
      const reportData: ReportData = {};
      
      if (config.type === 'leads' || config.type === 'performance') {
        reportData.leads = leads.filter(lead => {
          const createdDate = new Date(lead.created_at);
          return createdDate >= config.dateRange.from && createdDate <= config.dateRange.to;
        });
        
        reportData.summary = {
          totalLeads: reportData.leads.length,
          convertedLeads: reportData.leads.filter(l => l.balance > 0).length,
          totalRevenue: reportData.leads.reduce((sum, l) => sum + Number(l.balance), 0),
          conversionRate: reportData.leads.length > 0 
            ? (reportData.leads.filter(l => l.balance > 0).length / reportData.leads.length) * 100 
            : 0
        };
      }
      
      if (config.type === 'analytics') {
        reportData.analytics = snapshots.filter(snapshot => {
          const snapshotDate = new Date(snapshot.snapshot_date);
          return snapshotDate >= config.dateRange.from && snapshotDate <= config.dateRange.to;
        });
      }
      
      // Generate report
      let blob: Blob;
      const filename = `${config.type}-report-${format(new Date(), 'yyyy-MM-dd')}`;
      
      if (config.format === 'pdf') {
        blob = await reportService.generatePDFReport(config, reportData);
        reportService.downloadReport(blob, filename, 'pdf');
      } else if (config.format === 'excel') {
        blob = await reportService.generateExcelReport(config, reportData);
        reportService.downloadReport(blob, filename, 'xlsx');
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const reportTypes = [
    { value: 'leads', label: 'Leads Report', icon: FileText },
    { value: 'analytics', label: 'Analytics Report', icon: BarChart3 },
    { value: 'financial', label: 'Financial Report', icon: Table },
    { value: 'performance', label: 'Performance Report', icon: BarChart3 }
  ];
  
  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Report Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label>Report Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={config.type === type.value ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, type: type.value as any }))}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover open={showDatePicker === 'from'} onOpenChange={(open) => setShowDatePicker(open ? 'from' : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  From: {format(config.dateRange.from, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={config.dateRange.from}
                  onSelect={(date) => {
                    if (date) {
                      setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: date }
                      }));
                      setShowDatePicker(null);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            
            <Popover open={showDatePicker === 'to'} onOpenChange={(open) => setShowDatePicker(open ? 'to' : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  To: {format(config.dateRange.to, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={config.dateRange.to}
                  onSelect={(date) => {
                    if (date) {
                      setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: date }
                      }));
                      setShowDatePicker(null);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select 
            value={config.format} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, format: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map(format => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCharts"
              checked={config.includeCharts}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, includeCharts: checked as boolean }))
              }
            />
            <Label htmlFor="includeCharts">Include Charts and Graphs</Label>
          </div>
        </div>
        
        {/* Generate Button */}
        <Button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating Report...' : 'Generate Report'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReportBuilder;
