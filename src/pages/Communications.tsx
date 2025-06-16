
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useCommunications } from '../hooks/useCommunications';
import CommunicationsHeader from '../components/communications/CommunicationsHeader';
import CommunicationsFilters from '../components/communications/CommunicationsFilters';
import CommunicationsList from '../components/communications/CommunicationsList';

const Communications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { communications, isLoading, error } = useCommunications();

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSendEmail = () => {
    // TODO: Implement email sending functionality
    console.log('Send email clicked');
  };

  const handleMakeCall = () => {
    // TODO: Implement call functionality
    console.log('Make call clicked');
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading communications</p>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <CommunicationsHeader 
          onSendEmail={handleSendEmail}
          onMakeCall={handleMakeCall}
        />

        <Card>
          <CardHeader>
            <CommunicationsFilters
              searchTerm={searchTerm}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onTypeFilterChange={setTypeFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <CommunicationsList communications={filteredCommunications} />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Communications;
