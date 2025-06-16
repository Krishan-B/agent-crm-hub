
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, User, Database } from 'lucide-react';
import { useAuditLog, AuditLog } from '../../hooks/useAuditLog';
import { useAuth } from '../../contexts/AuthContext';

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchAuditLogs } = useAuditLog();
  const { profile } = useAuth();

  const loadAuditLogs = async () => {
    if (profile?.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const auditLogs = await fetchAuditLogs(100);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [profile]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <Button onClick={loadAuditLogs} disabled={isLoading} size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    {log.table_name && (
                      <Badge variant="outline" className="text-xs">
                        <Database className="h-3 w-3 mr-1" />
                        {log.table_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>User ID: {log.user_id || 'System'}</span>
                  </div>
                  
                  {log.record_id && (
                    <div className="mt-1">
                      Record ID: {log.record_id}
                    </div>
                  )}
                  
                  {log.user_agent && (
                    <div className="mt-1 text-xs">
                      Agent: {log.user_agent.substring(0, 80)}...
                    </div>
                  )}
                </div>

                {(log.old_values || log.new_values) && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer">
                      View Changes
                    </summary>
                    <div className="mt-2 space-y-2 text-xs">
                      {log.old_values && (
                        <div>
                          <span className="font-semibold">Old:</span>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <span className="font-semibold">New:</span>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}
            
            {logs.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No audit logs found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
