
import React from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';

const Calendar: React.FC = () => {
  const appointments = [
    {
      id: 1,
      title: 'KYC Review Call',
      client: 'John Smith',
      time: '10:00 AM',
      duration: '30 min',
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Account Setup',
      client: 'Emma Johnson',
      time: '2:00 PM',
      duration: '45 min',
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Follow-up Call',
      client: 'Michael Brown',
      time: '4:30 PM',
      duration: '15 min',
      status: 'completed'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600">Manage your appointments and schedule</p>
          </div>
          <Button>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-4 border rounded-lg ${
                        appointment.status === 'completed' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                            <p className="text-sm text-gray-600">{appointment.client}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </div>
                          <p className="text-xs text-gray-400">{appointment.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">Schedule Call</Button>
                <Button className="w-full" variant="outline">Schedule Demo</Button>
                <Button className="w-full" variant="outline">Schedule Follow-up</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
