
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, File, Check, X, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface KycDocument {
  id: string;
  document_type: string;
  file_path?: string;
  status: string;
  upload_date: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface KycDocumentUploadProps {
  leadId: string;
  documents: KycDocument[];
  onDocumentUploaded: () => void;
}

const documentTypes = [
  { value: 'government_id', label: 'Government ID' },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'selfie_with_id', label: 'Selfie with ID' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'utility_bill', label: 'Utility Bill' }
];

const KycDocumentUpload: React.FC<KycDocumentUploadProps> = ({
  leadId,
  documents,
  onDocumentUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and PDF files are allowed');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !user) {
      setError('Please select a file and document type');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Create file path: leadId/documentType_timestamp.extension
      const fileExtension = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;
      const filePath = `${leadId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload file: ' + uploadError.message);
        return;
      }

      // Save document record to database
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert([{
          lead_id: leadId,
          document_type: documentType,
          file_path: filePath,
          status: 'pending'
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        setError('Failed to save document record: ' + dbError.message);
        return;
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      onDocumentUploaded();
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: "Document uploaded successfully",
        description: "The document has been uploaded for review.",
      });

    } catch (err) {
      console.error('Upload error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-3 w-3" />;
      case 'rejected': return <X className="h-3 w-3" />;
      default: return null;
    }
  };

  const handleDocumentAction = async (docId: string, action: 'approve' | 'reject') => {
    if (profile?.role !== 'admin') return;

    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) {
        console.error('Error updating document:', error);
        setError('Failed to update document status');
        return;
      }

      onDocumentUploaded(); // Refresh the documents list
      
      toast({
        title: `Document ${action}d`,
        description: `The document has been ${action}d successfully.`,
      });
    } catch (err) {
      console.error('Error updating document:', err);
      setError('An unexpected error occurred');
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        toast({
          title: "Download failed",
          description: "Failed to download document",
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: "Download failed",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (docId: string, filePath: string) => {
    if (profile?.role !== 'admin') return;

    try {
      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('kyc-documents')
          .remove([filePath]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .delete()
        .eq('id', docId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        setError('Failed to delete document');
        return;
      }

      onDocumentUploaded(); // Refresh the documents list
      
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    } catch (err) {
      console.error('Delete error:', err);
      setError('An unexpected error occurred');
    }
  };

  const previewDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 60); // 1 minute expiry

      if (error) {
        console.error('Preview error:', error);
        toast({
          title: "Preview failed",
          description: "Failed to generate preview URL",
          variant: "destructive",
        });
        return;
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Preview error:', err);
      toast({
        title: "Preview failed",
        description: "Failed to preview document",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload KYC Document</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="document-type">Document Type</Label>
            <select
              id="document-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select document type</option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="file-upload">File (JPEG, PNG, PDF - Max 10MB)</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFile && (
            <div className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {getStatusIcon(doc.status)}
                      <span className="ml-1">{doc.status}</span>
                    </Badge>

                    <div className="flex space-x-1">
                      {doc.file_path && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewDocument(doc.file_path!)}
                            title="Preview document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadDocument(doc.file_path!, `${doc.document_type}.pdf`)}
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {profile?.role === 'admin' && doc.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentAction(doc.id, 'approve')}
                            className="text-green-600 hover:text-green-700"
                            title="Approve document"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentAction(doc.id, 'reject')}
                            className="text-red-600 hover:text-red-700"
                            title="Reject document"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {profile?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(doc.id, doc.file_path!)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KycDocumentUpload;
