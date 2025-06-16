import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Download, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkOperations } from '../../hooks/useBulkOperations';
import { useDuplicateDetection } from '../../hooks/useDuplicateDetection';
import { useDataValidation } from '../../hooks/useDataValidation';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export const BulkImportExport: React.FC = () => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create'>('skip');
  const [validationMode, setValidationMode] = useState<'strict' | 'relaxed'>('strict');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { 
    importLeads, 
    exportLeads, 
    isExporting, 
    exportProgress 
  } = useBulkOperations();
  
  const { 
    detectDuplicates, 
    duplicateResults 
  } = useDuplicateDetection();
  
  const { 
    validateLeadsData, 
    validationErrors 
  } = useDataValidation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setImportFile(file);
      setImportResult(null);
    }
  };

  const parseCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const obj: any = {};
              headers.forEach((header, i) => {
                obj[header] = values[i] || '';
              });
              obj._rowNumber = index + 2; // +2 because we start from row 2 (after header)
              return obj;
            });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // Parse CSV
      const rawData = await parseCSV(importFile);
      setImportProgress(10);

      // Validate data
      const validationResult = await validateLeadsData(rawData, validationMode);
      setImportProgress(30);

      if (validationResult.hasErrors && validationMode === 'strict') {
        setImportResult({
          total: rawData.length,
          successful: 0,
          failed: rawData.length,
          duplicates: 0,
          errors: validationResult.errors
        });
        setIsImporting(false);
        return;
      }

      // Detect duplicates
      const duplicateResult = await detectDuplicates(validationResult.validData);
      setImportProgress(50);

      // Process data based on duplicate handling
      let dataToImport = validationResult.validData;
      let duplicateCount = 0;

      if (duplicateResult.duplicates.length > 0) {
        duplicateCount = duplicateResult.duplicates.length;
        
        if (duplicateHandling === 'skip') {
          dataToImport = validationResult.validData.filter(
            item => !duplicateResult.duplicates.some(dup => dup.newRecord.email === item.email)
          );
        } else if (duplicateHandling === 'update') {
          // Handle updates separately
          for (const duplicate of duplicateResult.duplicates) {
            await importLeads([duplicate.newRecord], 'update');
          }
          dataToImport = validationResult.validData.filter(
            item => !duplicateResult.duplicates.some(dup => dup.newRecord.email === item.email)
          );
        }
        // For 'create', we keep all data
      }

      setImportProgress(70);

      // Import data
      const importResult = await importLeads(dataToImport, 'create');
      setImportProgress(100);

      setImportResult({
        total: rawData.length,
        successful: importResult.successful + (duplicateHandling === 'update' ? duplicateCount : 0),
        failed: validationResult.errors.length + importResult.failed,
        duplicates: duplicateHandling === 'skip' ? duplicateCount : 0,
        errors: [...validationResult.errors, ...importResult.errors]
      });

      toast({
        title: "Import completed",
        description: `Successfully imported ${importResult.successful} leads.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportLeads({
        format: 'csv',
        includeArchived: false,
        filters: {}
      });
      
      toast({
        title: "Export completed",
        description: "Leads have been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred during export.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Duplicate Handling</label>
              <Select value={duplicateHandling} onValueChange={(value: any) => setDuplicateHandling(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip duplicates</SelectItem>
                  <SelectItem value="update">Update existing</SelectItem>
                  <SelectItem value="create">Create anyway</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Validation Mode</label>
              <Select value={validationMode} onValueChange={(value: any) => setValidationMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict (reject on errors)</SelectItem>
                  <SelectItem value="relaxed">Relaxed (skip invalid rows)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="mb-2"
            />
            <p className="text-sm text-gray-500">
              Upload a CSV file with columns: first_name, last_name, email, phone, country, status
            </p>
          </div>

          {importFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Selected file: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}

          {isImporting && (
            <div>
              <Progress value={importProgress} className="mb-2" />
              <p className="text-sm text-gray-500">Importing... {importProgress}%</p>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!importFile || isImporting}
            className="w-full"
          >
            {isImporting ? 'Importing...' : 'Import Leads'}
          </Button>

          {importResult && (
            <div className="space-y-3">
              <Separator />
              <h4 className="font-medium">Import Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{importResult.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                  <div className="text-sm text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                  <div className="text-sm text-gray-500">Duplicates</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-600 mb-2">Errors ({importResult.errors.length})</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm bg-red-50 p-2 rounded">
                        <span className="font-medium">Row {error.row}:</span> {error.error}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-sm text-gray-500">
                        And {importResult.errors.length - 10} more errors...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isExporting && (
            <div className="mb-4">
              <Progress value={exportProgress} className="mb-2" />
              <p className="text-sm text-gray-500">Exporting... {exportProgress}%</p>
            </div>
          )}
          
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? 'Exporting...' : 'Export All Leads'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
