
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Phone } from 'lucide-react';

interface CommunicationsHeaderProps {
  onSendEmail: () => void;
  onMakeCall: () => void;
}

const CommunicationsHeader: React.FC<CommunicationsHeaderProps> = ({
  onSendEmail,
  onMakeCall
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <p className="text-gray-600">Track all customer communications</p>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onSendEmail}>
          <Bell className="h-4 w-4 mr-2" />
          Send Email
        </Button>
        <Button onClick={onMakeCall}>
          <Phone className="h-4 w-4 mr-2" />
          Make Call
        </Button>
      </div>
    </div>
  );
};

export default CommunicationsHeader;
