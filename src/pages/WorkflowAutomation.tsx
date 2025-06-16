
import React from 'react';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AutomatedLeadAssignment from '../components/workflow/AutomatedLeadAssignment';
import EmailAutomation from '../components/workflow/EmailAutomation';
import FollowUpReminders from '../components/workflow/FollowUpReminders';
import EscalationRules from '../components/workflow/EscalationRules';

const WorkflowAutomation: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-2">
            Automate your lead management processes to improve efficiency and ensure consistent follow-up.
          </p>
        </div>

        <Tabs defaultValue="assignment" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assignment">Lead Assignment</TabsTrigger>
            <TabsTrigger value="email">Email Automation</TabsTrigger>
            <TabsTrigger value="reminders">Follow-up Reminders</TabsTrigger>
            <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="assignment" className="space-y-4">
            <AutomatedLeadAssignment />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <EmailAutomation />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <FollowUpReminders />
          </TabsContent>

          <TabsContent value="escalation" className="space-y-4">
            <EscalationRules />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default WorkflowAutomation;
