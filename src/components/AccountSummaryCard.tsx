
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lead } from '../hooks/useLeads';

interface AccountSummaryCardProps {
  lead: Lead;
  getStatusColor: (status: string) => string;
}

const AccountSummaryCard: React.FC<AccountSummaryCardProps> = ({ lead, getStatusColor }) => {
  return (
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
  );
};

export default AccountSummaryCard;
