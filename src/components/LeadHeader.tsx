
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Bell, Calendar } from 'lucide-react';
import { Lead } from '../hooks/useLeads';

interface LeadHeaderProps {
  lead: Lead;
}

const LeadHeader: React.FC<LeadHeaderProps> = ({ lead }) => {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {lead.first_name} {lead.last_name}
        </h1>
        <p className="text-gray-600">{lead.email}</p>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline">
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>
      </div>
    </div>
  );
};

export default LeadHeader;
