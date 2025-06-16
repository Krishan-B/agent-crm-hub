
import React, { useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical,
  Eye,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useOptimizedLeads } from '../hooks/useOptimizedLeads';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CommunicationDialog from '../components/CommunicationDialog';
import AppointmentDialog from '../components/AppointmentDialog';
import { Link } from 'react-router-dom';

const OptimizedLeads: React.FC = () => {
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    leads,
    totalPages,
    currentPage,
    totalCount,
    isLoading,
    error,
    searchFilters,
    updateFilters,
    clearFilters,
    changePage,
    exportLeads,
    refetch
  } = useOptimizedLeads();

  const handleExport = useCallback(async () => {
    try {
      await exportLeads('csv');
      toast({
        title: "Export Successful",
        description: "Leads data has been exported to CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export leads data. Please try again.",
        variant: "destructive",
      });
    }
  }, [exportLeads, toast]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select leads to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    // Implement bulk actions here
    console.log(`Performing ${action} on leads:`, selectedLeads);
    toast({
      title: "Bulk Action",
      description: `${action} performed on ${selectedLeads.length} leads.`,
    });
    setSelectedLeads([]);
  }, [selectedLeads, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading leads</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
            <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-gray-600">
              Manage and track your {totalCount} leads efficiently
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Converted</p>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.balance > 0).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">KYC Pending</p>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.kyc_status === 'pending').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads by name, email, or phone..."
                  value={searchFilters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select 
                  value={searchFilters.status || 'all'} 
                  onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={searchFilters.kycStatus || 'all'} 
                  onValueChange={(value) => updateFilters({ kycStatus: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="KYC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All KYC</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            {selectedLeads.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedLeads.length} leads selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('assign')}>
                    Assign Agent
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('status')}>
                    Change Status
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                    Export Selected
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.id]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          <Badge className={getKycStatusColor(lead.kyc_status)}>
                            KYC: {lead.kyc_status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{lead.email}</span>
                          {lead.phone && <span>{lead.phone}</span>}
                          <span>{lead.country}</span>
                          {lead.assigned_agent && (
                            <span>Agent: {lead.assigned_agent.first_name} {lead.assigned_agent.last_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <p className="font-medium">${lead.balance.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/leads/${lead.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <CommunicationDialog
                        leadId={lead.id}
                        leadName={`${lead.first_name} ${lead.last_name}`}
                        leadEmail={lead.email}
                        leadPhone={lead.phone}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        }
                      />
                      <AppointmentDialog
                        leadId={lead.id}
                        leadName={`${lead.first_name} ${lead.last_name}`}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}

                {leads.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No leads found matching your criteria.</p>
                    <Button className="mt-4" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing page {currentPage} of {totalPages} ({totalCount} total leads)
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => changePage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => changePage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => changePage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OptimizedLeads;
