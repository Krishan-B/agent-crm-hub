
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { KycDocument } from '../hooks/useLeadDetail';

interface KycTabProps {
  kycDocuments: KycDocument[];
  getStatusColor: (status: string) => string;
}

const KycTab: React.FC<KycTabProps> = ({ kycDocuments, getStatusColor }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {kycDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{doc.document_type.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-gray-500">Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(doc.status)}>
                  {doc.status}
                </Badge>
                {doc.status === 'pending' && (
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {kycDocuments.length === 0 && (
            <p className="text-gray-500 text-center py-4">No KYC documents uploaded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KycTab;
