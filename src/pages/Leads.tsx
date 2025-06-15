
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Bell } from 'lucide-react';

const Leads: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const mockLeads = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123',
      country: 'United States',
      status: 'new',
      balance: 0,
      bonusAmount: 0,
      registrationDate: '2024-01-15',
      lastContact: null,
      assignedAgent: 'Jane Agent'
    },
    {
      id: '2',
      firstName: 'Emma',
      lastName: 'Johnson',
      email: 'emma.johnson@example.com',
      phone: '+1-555-0124',
      country: 'Canada',
      status: 'kyc_pending',
      balance: 1000,
      bonusAmount: 100,
      registrationDate: '2024-01-14',
      lastContact: '2024-01-15',
      assignedAgent: 'Jane Agent'
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@example.com',
      phone: '+44-20-7946-0958',
      country: 'United Kingdom',
      status: 'contacted',
      balance: 500,
      bonusAmount: 50,
      registrationDate: '2024-01-13',
      lastContact: '2024-01-14',
      assignedAgent: 'John Admin'
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Davis',
      email: 'sarah.davis@example.com',
      phone: '+61-2-9374-4000',
      country: 'Australia',
      status: 'kyc_approved',
      balance: 2000,
      bonusAmount: 200,
      registrationDate: '2024-01-12',
      lastContact: '2024-01-13',
      assignedAgent: 'Jane Agent'
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@example.com',
      phone: '+49-30-12345678',
      country: 'Germany',
      status: 'active',
      balance: 5000,
      bonusAmount: 500,
      registrationDate: '2024-01-10',
      lastContact: '2024-01-12',
      assignedAgent: 'John Admin'
    }
  ];

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

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = `${lead.firstName} ${lead.lastName} ${lead.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            </div>
          </CardHeader>
          <CardContent>
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
                  {filteredLeads.map((lead) => (
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
                              {lead.firstName} {lead.lastName}
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
                          <p className="font-medium">${lead.balance.toLocaleString()}</p>
                          {lead.bonusAmount > 0 && (
                            <p className="text-sm text-green-600">+${lead.bonusAmount} bonus</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">{lead.assignedAgent}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Bell className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leads;
