
import React from 'react';
import Layout from '../components/Layout';

const CalendarView: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-2">
            Manage your appointments and schedule.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Calendar functionality will be implemented here.</p>
        </div>
      </div>
    </Layout>
  );
};

export default CalendarView;
