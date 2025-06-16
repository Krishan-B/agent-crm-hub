
import React from 'react';
import Layout from '../components/Layout';
import CalendarView from '../components/CalendarView';

const Calendar: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600">Manage your appointments and schedule</p>
          </div>
        </div>

        <CalendarView />
      </div>
    </Layout>
  );
};

export default Calendar;
