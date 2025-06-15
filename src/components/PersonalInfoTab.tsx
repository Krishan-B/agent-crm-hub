
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lead } from '../hooks/useLeads';

interface PersonalInfoTabProps {
  lead: Lead;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ lead }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="text-sm">{lead.first_name} {lead.last_name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="text-sm">{lead.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Phone</label>
          <p className="text-sm">{lead.phone || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Country</label>
          <p className="text-sm">{lead.country}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
          <p className="text-sm">{lead.date_of_birth || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Registration Date</label>
          <p className="text-sm">{new Date(lead.registration_date).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoTab;
