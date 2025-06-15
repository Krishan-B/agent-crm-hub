
import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Phone, User } from 'lucide-react';

const Communications: React.FC = () => {
  const communications = [
    {
      id: 1,
      type: 'email',
      subject: 'Welcome to CFD Trading',
      client: 'John Smith',
      timestamp: '2024-01-16 10:30 AM',
      status: 'sent'
    },
    {
      id: 2,
      type: 'call',
      subject: 'KYC Follow-up Call',
      client: 'Emma Johnson',
      timestamp: '2024-01-16 9:15 AM',
      status: 'completed',
      duration: '12 minutes'
    },
    {
      id: 3,
      type: 'email',
      subject: 'Account Verification Required',
      client: 'Michael Brown',
      timestamp: '2024-01-15 4:45 PM',
      status: 'delivered'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Bell className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-600">Track all customer communications</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button>
              <Phone className="h-4 w-4 mr-2" />
              Make Call
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communications.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(comm.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{comm.subject}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{comm.client}</span>
                        {comm.duration && <span>• {comm.duration}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(comm.status)}`}>
                      {comm.status}
                    </p>
                    <p className="text-xs text-gray-500">{comm.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Communications;
