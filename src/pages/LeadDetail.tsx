
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, Bell, Check, X, Calendar } from 'lucide-react';

const LeadDetail: React.FC = () => {
  const { id } = useParams();
  const [newComment, setNewComment] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');

  // Mock lead data - in real app, fetch from API using id
  const lead = {
    id: id,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0123',
    country: 'United States',
    dateOfBirth: '1990-05-15',
    status: 'kyc_pending',
    balance: 1000,
    bonusAmount: 100,
    registrationDate: '2024-01-15',
    lastContact: '2024-01-16',
    assignedAgent: 'Jane Agent',
    kycStatus: 'submitted',
    kycDocuments: [
      { type: 'Government ID', status: 'approved', uploadDate: '2024-01-15' },
      { type: 'Proof of Address', status: 'pending', uploadDate: '2024-01-15' },
      { type: 'Selfie with ID', status: 'pending', uploadDate: '2024-01-15' }
    ]
  };

  const activities = [
    {
      id: 1,
      type: 'comment',
      user: 'Jane Agent',
      content: 'Initial contact made via email',
      timestamp: '2024-01-16 10:30 AM'
    },
    {
      id: 2,
      type: 'kyc_submit',
      user: 'System',
      content: 'KYC documents submitted',
      timestamp: '2024-01-15 3:45 PM'
    },
    {
      id: 3,
      type: 'registration',
      user: 'System',
      content: 'Lead registered on platform',
      timestamp: '2024-01-15 2:15 PM'
    }
  ];

  const transactions = [
    {
      id: 1,
      type: 'deposit',
      amount: 1000,
      status: 'completed',
      date: '2024-01-15',
      reference: 'DEP001'
    },
    {
      id: 2,
      type: 'bonus',
      amount: 100,
      status: 'completed',
      date: '2024-01-15',
      reference: 'BON001'
    }
  ];

  const handleAddBalance = () => {
    if (balanceAmount) {
      console.log('Adding balance:', balanceAmount);
      setBalanceAmount('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.firstName} {lead.lastName}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="kyc">KYC Management</TabsTrigger>
                <TabsTrigger value="balance">Balance & Transactions</TabsTrigger>
                <TabsTrigger value="communications">Communications</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm">{lead.firstName} {lead.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{lead.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm">{lead.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Country</label>
                      <p className="text-sm">{lead.country}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-sm">{lead.dateOfBirth}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-sm">{lead.registrationDate}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="kyc" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>KYC Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lead.kycDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{doc.type}</p>
                            <p className="text-sm text-gray-500">Uploaded: {doc.uploadDate}</p>
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="balance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter amount"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        type="number"
                      />
                      <Button onClick={handleAddBalance}>Add Balance</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium capitalize">{transaction.type}</p>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${transaction.amount}</p>
                            <p className="text-sm text-gray-500">{transaction.reference}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Communication History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div key={activity.id} className="flex space-x-3 p-3 bg-gray-50 rounded">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">{activity.content}</p>
                              <p className="text-xs text-gray-500">{activity.user} • {activity.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Balance</label>
                  <p className="text-2xl font-bold text-green-600">${lead.balance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bonus Amount</label>
                  <p className="text-lg font-semibold text-blue-600">${lead.bonusAmount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Agent</label>
                  <p className="text-sm">{lead.assignedAgent}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">Update Status</Button>
                <Button className="w-full" variant="outline">Send Email</Button>
                <Button className="w-full" variant="outline">Schedule Call</Button>
                <Button className="w-full" variant="outline">Add Note</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleAddComment} className="w-full">
                  Add Comment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetail;
