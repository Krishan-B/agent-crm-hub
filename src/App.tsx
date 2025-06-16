
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Calendar from "./pages/Calendar";
import Communications from "./pages/Communications";
import EmailTemplates from "./pages/EmailTemplates";
import Notifications from "./pages/Notifications";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/leads" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Leads />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/leads/:id" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <LeadDetail />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/analytics" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/calendar" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/communications" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Communications />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/email-templates" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <EmailTemplates />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/notifications" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/users" element={
                  <ErrorBoundary>
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/settings" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
