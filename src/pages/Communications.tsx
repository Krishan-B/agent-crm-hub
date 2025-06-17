
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useCommunications } from '../hooks/useCommunications';
import CommunicationsHeader from '../components/communications/CommunicationsHeader';
import CommunicationsFilters from '../components/communications/CommunicationsFilters';
import CommunicationsList from '../components/communications/CommunicationsList';
import RealTimeCommunications from '../components/communications/RealTimeCommunications';

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
    console.log('Send email clicked');
  };

  const handleMakeCall = () => {
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

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Communication History</TabsTrigger>
            <TabsTrigger value="realtime">Real-time Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
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
          </TabsContent>

          <TabsContent value="realtime">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeCommunications
                leadId="demo-lead-1"
                leadName="John Doe"
              />
              <RealTimeCommunications
                leadId="demo-lead-2"
                leadName="Jane Smith"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Communications;
