
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import Leads from './pages/Leads';
import Communications from './pages/Communications';
import Calendar from './pages/Calendar';
import ProtectedRoute from './components/ProtectedRoute';
import Security from './pages/Security';
import DataManagement from './pages/DataManagement';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              } />
              <Route
                path="/user-management"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications"
                element={
                  <ProtectedRoute>
                    <Communications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/security" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Security />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/data-management" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DataManagement />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
