
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const QuickActionsCard: React.FC = () => {
  return (
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
  );
};

export default QuickActionsCard;
