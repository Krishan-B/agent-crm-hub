
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useDuplicateDetection } from '../../hooks/useDuplicateDetection';
import { useToast } from '@/hooks/use-toast';

export const BulkImportExport: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'create' | 'update'>('create');
  const [importResult, setImportResult] = useState<any>(null);
  const [duplicateResults, setDuplicateResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importLeads, exportLeads, isExporting, exportProgress } = useBulkOperations();
  const { detectDuplicates, resolveDuplicate, isDetecting } = useDuplicateDetection();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setDuplicateResults(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = { _rowNumber: i + 1 };
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);

      // Detect duplicates first
      const duplicateDetectionResult = await detectDuplicates(data);
      setDuplicateResults(duplicateDetectionResult);

      if (duplicateDetectionResult.duplicates.length > 0) {
        toast({
          title: "Duplicates Detected",
          description: `Found ${duplicateDetectionResult.duplicates.length} potential duplicates. Please review them before proceeding.`,
          variant: "destructive",
        });
        return;
      }

      // If no duplicates, proceed with import
      const result = await importLeads(duplicateDetectionResult.unique, importMode);
      setImportResult(result);

      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.successful} leads. ${result.failed} failed.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import leads. Please check your file format.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateResolution = async (duplicate: any, action: 'merge' | 'keep_new' | 'keep_existing') => {
    try {
      await resolveDuplicate(duplicate, action);
      
      // Remove resolved duplicate from results
      setDuplicateResults((prev: any) => ({
        ...prev,
        duplicates: prev.duplicates.filter((d: any) => d !== duplicate)
      }));

      toast({
        title: "Duplicate Resolved",
        description: `Duplicate has been ${action === 'merge' ? 'merged' : action === 'keep_new' ? 'replaced with new data' : 'kept unchanged'}.`,
      });
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      toast({
        title: "Error",
        description: "Failed to resolve duplicate.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportLeads({
        format: 'csv',
        includeArchived: false
      });

      toast({
        title: "Export Started",
        description: "Your export will download shortly.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export leads.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Leads</TabsTrigger>
          <TabsTrigger value="export">Export Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="file">CSV File</Label>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <Label htmlFor="mode">Import Mode</Label>
                  <Select value={importMode} onValueChange={(value: 'create' | 'update') => setImportMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">Create New Leads</SelectItem>
                      <SelectItem value="update">Update Existing Leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || isDetecting}
                className="w-full"
              >
                {isDetecting ? 'Detecting Duplicates...' : 'Import Leads'}
              </Button>

              {duplicateResults && duplicateResults.duplicates.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Duplicate Detection Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {duplicateResults.duplicates.map((duplicate: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">Potential Duplicate Found</h4>
                              <p className="text-sm text-gray-600">
                                Confidence: {Math.round(duplicate.confidence * 100)}%
                              </p>
                              <p className="text-sm text-gray-600">
                                Matching fields: {duplicate.matchFields.join(', ')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <h5 className="font-medium text-green-700">Existing Record</h5>
                              <p>Name: {duplicate.existingRecord.first_name} {duplicate.existingRecord.last_name}</p>
                              <p>Email: {duplicate.existingRecord.email}</p>
                              <p>Phone: {duplicate.existingRecord.phone}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-blue-700">New Record</h5>
                              <p>Name: {duplicate.newRecord.first_name} {duplicate.newRecord.last_name}</p>
                              <p>Email: {duplicate.newRecord.email}</p>
                              <p>Phone: {duplicate.newRecord.phone}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDuplicateResolution(duplicate, 'merge')}
                            >
                              Merge
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDuplicateResolution(duplicate, 'keep_new')}
                            >
                              Keep New
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDuplicateResolution(duplicate, 'keep_existing')}
                            >
                              Keep Existing
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {importResult && (
                <Alert className={importResult.failed > 0 ? "border-yellow-500" : "border-green-500"}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed: {importResult.successful} successful, {importResult.failed} failed
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">View Errors</summary>
                        <div className="mt-2 space-y-1">
                          {importResult.errors.slice(0, 5).map((error: any, index: number) => (
                            <div key={index} className="text-sm text-red-600">
                              Row {error.row}: {error.error}
                            </div>
                          ))}
                          {importResult.errors.length > 5 && (
                            <div className="text-sm text-gray-500">
                              And {importResult.errors.length - 5} more errors...
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Export all lead data including contact information, status, balances, and assigned agents.
                  </AlertDescription>
                </Alert>

                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Exporting...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                  </div>
                )}

                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? 'Exporting...' : 'Export to CSV'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
