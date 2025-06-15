import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, Bell, Check, X, Calendar, Loader2 } from 'lucide-react';
import { useLeadDetail } from '../hooks/useLeadDetail';
import { useToast } from '@/hooks/use-toast';
import LeadScoring from '../components/LeadScoring';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const { 
    lead, 
    activities, 
    transactions, 
    kycDocuments, 
    isLoading, 
    error, 
    addActivity, 
    addTransaction 
  } = useLeadDetail(id || '');

  const handleAddBalance = async () => {
    if (!balanceAmount || !id) return;
    
    try {
      const amount = parseFloat(balanceAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid positive amount.",
          variant: "destructive",
        });
        return;
      }

      const reference = `DEP${Date.now()}`;
      await addTransaction('deposit', amount, reference);
      
      setBalanceAmount('');
      toast({
        title: "Balance Added",
        description: `Successfully added $${amount} to the lead's balance.`,
      });
    } catch (error) {
      console.error('Error adding balance:', error);
      toast({
        title: "Error",
        description: "Failed to add balance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    
    try {
      await addActivity('comment', newComment.trim());
      setNewComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
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

  const formatActivityType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !lead) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading lead details</p>
            <p className="text-gray-500">{error || 'Lead not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
              </TabsContent>

              <TabsContent value="kyc" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>KYC Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {kycDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{doc.document_type.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm text-gray-500">Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
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
                      {kycDocuments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No KYC documents uploaded yet.</p>
                      )}
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
                            <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${Number(transaction.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{transaction.reference}</p>
                          </div>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No transactions found.</p>
                      )}
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
                              <p className="text-sm">{activity.content || formatActivityType(activity.activity_type)}</p>
                              <p className="text-xs text-gray-500">
                                {activity.creator ? 
                                  `${activity.creator.first_name} ${activity.creator.last_name}` : 
                                  'System'
                                } • {new Date(activity.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {activities.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No activities found.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Add AI Lead Scoring */}
            <LeadScoring 
              leadId={leadId} 
              onScoreGenerated={(score) => {
                console.log('Lead score generated:', score);
                // Optionally refresh lead data
                fetchLeadDetail();
              }}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Balance</label>
                  <p className="text-2xl font-bold text-green-600">${Number(lead.balance).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bonus Amount</label>
                  <p className="text-lg font-semibold text-blue-600">${Number(lead.bonus_amount).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Agent</label>
                  <p className="text-sm">
                    {lead.assigned_agent ? 
                      `${lead.assigned_agent.first_name} ${lead.assigned_agent.last_name}` : 
                      'Unassigned'
                    }
                  </p>
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
