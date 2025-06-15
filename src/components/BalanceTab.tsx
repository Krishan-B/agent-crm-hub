
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transaction } from '../hooks/useLeadDetail';

interface BalanceTabProps {
  balanceAmount: string;
  setBalanceAmount: (amount: string) => void;
  handleAddBalance: () => void;
  transactions: Transaction[];
}

const BalanceTab: React.FC<BalanceTabProps> = ({ 
  balanceAmount, 
  setBalanceAmount, 
  handleAddBalance, 
  transactions 
}) => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default BalanceTab;
