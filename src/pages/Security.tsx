
import React from 'react';
import Layout from '../components/Layout';
import TwoFactorSetup from '../components/security/TwoFactorSetup';
import AuditLogViewer from '../components/security/AuditLogViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

const Security: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600">Manage your account security and view system audit logs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold">2FA Enabled</p>
                  <p className="text-sm text-gray-500">Extra protection</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold">Data Encrypted</p>
                  <p className="text-sm text-gray-500">Sensitive fields</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold">Audit Logging</p>
                  <p className="text-sm text-gray-500">All actions tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-semibold">Rate Limited</p>
                  <p className="text-sm text-gray-500">Prevents abuse</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TwoFactorSetup />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Encryption
              </CardTitle>
              <CardDescription>
                Sensitive data fields are automatically encrypted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Personal Information</span>
                  <span className="text-green-600 text-sm">Encrypted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Financial Data</span>
                  <span className="text-green-600 text-sm">Encrypted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Communication Logs</span>
                  <span className="text-green-600 text-sm">Encrypted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Authentication Tokens</span>
                  <span className="text-green-600 text-sm">Encrypted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AuditLogViewer />
      </div>
    </Layout>
  );
};

export default Security;
