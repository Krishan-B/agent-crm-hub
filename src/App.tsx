import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import OptimizedLeads from './pages/OptimizedLeads';
import Analytics from './pages/Analytics';
import Communications from './pages/Communications';
import CalendarView from './pages/CalendarView';
import EmailTemplates from './pages/EmailTemplates';
import DataManagement from './pages/DataManagement';
import Integrations from './pages/Integrations';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Security from './pages/Security';
import NotFound from './pages/NotFound';
import WorkflowAutomation from './pages/WorkflowAutomation';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="/optimized-leads" element={<ProtectedRoute><OptimizedLeads /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/communications" element={<ProtectedRoute><Communications /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
          <Route path="/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
          <Route path="/workflow-automation" element={<ProtectedRoute><WorkflowAutomation /></ProtectedRoute>} />
          <Route path="/data-management" element={<ProtectedRoute><DataManagement /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
