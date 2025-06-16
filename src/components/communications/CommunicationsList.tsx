
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User, MessageSquare, Bell } from 'lucide-react';
import { Communication } from '../../hooks/useCommunications';

interface CommunicationsListProps {
  communications: Communication[];
}

const CommunicationsList: React.FC<CommunicationsListProps> = ({ communications }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (communications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No communications found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {communications.map((comm) => (
        <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {getTypeIcon(comm.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">
                  {comm.subject || `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} Communication`}
                </h3>
                <Badge className={getStatusColor(comm.status)}>
                  {comm.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <span>To: {comm.recipient_email || comm.recipient_phone || 'N/A'}</span>
                {comm.creator && (
                  <>
                    <span>•</span>
                    <span>By: {comm.creator.first_name} {comm.creator.last_name}</span>
                  </>
                )}
              </div>
              {comm.content && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {comm.content}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{formatDate(comm.created_at)}</p>
            {comm.sent_at && comm.sent_at !== comm.created_at && (
              <p className="text-xs text-gray-400">Sent: {formatDate(comm.sent_at)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommunicationsList;
