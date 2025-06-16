
import React from 'react';
import Layout from '../components/Layout';
import EmailTemplateManager from '../components/EmailTemplateManager';

const EmailTemplates: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">
            Create and manage email templates for consistent communication with leads.
          </p>
        </div>
        <EmailTemplateManager />
      </div>
    </Layout>
  );
};

export default EmailTemplates;
