
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useLeadDetail } from '../hooks/useLeadDetail';
import { useToast } from '@/hooks/use-toast';
import LeadScoring from '../components/LeadScoring';
import LeadHeader from '../components/LeadHeader';
import PersonalInfoTab from '../components/PersonalInfoTab';
import KycTab from '../components/KycTab';
import BalanceTab from '../components/BalanceTab';
import CommunicationsTab from '../components/CommunicationsTab';
import AccountSummaryCard from '../components/AccountSummaryCard';
import QuickActionsCard from '../components/QuickActionsCard';
import AddCommentCard from '../components/AddCommentCard';
import CommunicationDialog from '../components/CommunicationDialog';
import LeadTagManager from '../components/LeadTagManager';

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
    fetchLeadDetail,
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
        <LeadHeader lead={lead} />

        {/* Lead Tags */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
          <LeadTagManager leadId={lead.id} />
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
                <PersonalInfoTab lead={lead} />
              </TabsContent>

              <TabsContent value="kyc" className="space-y-4">
                <KycTab kycDocuments={kycDocuments} getStatusColor={getStatusColor} />
              </TabsContent>

              <TabsContent value="balance" className="space-y-4">
                <BalanceTab 
                  balanceAmount={balanceAmount}
                  setBalanceAmount={setBalanceAmount}
                  handleAddBalance={handleAddBalance}
                  transactions={transactions}
                />
              </TabsContent>

              <TabsContent value="communications" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Communications History</h3>
                  <CommunicationDialog
                    leadId={lead.id}
                    leadName={`${lead.first_name} ${lead.last_name}`}
                    leadEmail={lead.email}
                    leadPhone={lead.phone}
                  />
                </div>
                <CommunicationsTab 
                  activities={activities}
                  formatActivityType={formatActivityType}
                />
              </TabsContent>
            </Tabs>

            <LeadScoring 
              leadId={id || ''} 
              onScoreGenerated={(score) => {
                console.log('Lead score generated:', score);
                fetchLeadDetail();
              }}
            />
          </div>

          <div className="space-y-6">
            <AccountSummaryCard lead={lead} getStatusColor={getStatusColor} />
            <QuickActionsCard />
            <AddCommentCard 
              newComment={newComment}
              setNewComment={setNewComment}
              handleAddComment={handleAddComment}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetail;
