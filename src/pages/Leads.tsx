
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Bell, Loader2, Filter } from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import CommunicationDialog from '../components/CommunicationDialog';
import AdvancedSearchDialog from '../components/AdvancedSearchDialog';

const Leads: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { leads, isLoading, error } = useLeads();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'kyc_pending': return 'bg-orange-100 text-orange-800';
      case 'kyc_approved': return 'bg-green-100 text-green-800';
      case 'kyc_rejected': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Use search results if available, otherwise use filtered leads
  const displayLeads = showSearchResults ? searchResults : leads.filter(lead => {
    const matchesSearch = `${lead.first_name} ${lead.last_name} ${lead.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading leads</p>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">Manage and track all your customer leads</p>
          </div>
          <Button>Add Lead</Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="kyc_pending">KYC Pending</SelectItem>
                    <SelectItem value="kyc_approved">KYC Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <AdvancedSearchDialog onResults={handleSearchResults} />
              </div>
            </div>
            {showSearchResults && (
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-800">
                  Showing {searchResults.length} search results
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  Clear Search
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Lead</th>
                      <th className="text-left py-3 px-4">Contact</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Balance</th>
                      <th className="text-left py-3 px-4">Assigned Agent</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLeads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <Link 
                                to={`/leads/${lead.id}`}
                                className="font-medium text-gray-900 hover:text-blue-600"
                              >
                                {lead.first_name} {lead.last_name}
                              </Link>
                              <p className="text-sm text-gray-500">{lead.country}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm text-gray-900">{lead.email}</p>
                            <p className="text-sm text-gray-500">{lead.phone}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">${Number(lead.balance).toLocaleString()}</p>
                            {lead.bonus_amount > 0 && (
                              <p className="text-sm text-green-600">+${Number(lead.bonus_amount)} bonus</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-gray-900">
                            {lead.assigned_agent ? 
                              `${lead.assigned_agent.first_name} ${lead.assigned_agent.last_name}` : 
                              'Unassigned'
                            }
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <CommunicationDialog
                              leadId={lead.id}
                              leadName={`${lead.first_name} ${lead.last_name}`}
                              leadEmail={lead.email}
                              leadPhone={lead.phone}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Phone className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <Button variant="ghost" size="sm">
                              <Bell className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {displayLeads.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No leads found matching your criteria.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leads;
