
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { Activity } from '../hooks/useLeadDetail';

interface CommunicationsTabProps {
  activities: Activity[];
  formatActivityType: (type: string) => string;
}

const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ activities, formatActivityType }) => {
  return (
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
  );
};

export default CommunicationsTab;
