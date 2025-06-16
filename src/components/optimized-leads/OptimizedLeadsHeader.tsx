
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, UserPlus, Zap } from 'lucide-react';

interface OptimizedLeadsHeaderProps {
  viewMode: 'paginated' | 'infinite';
  setViewMode: (mode: 'paginated' | 'infinite') => void;
  onExport: () => void;
}

export const OptimizedLeadsHeader: React.FC<OptimizedLeadsHeaderProps> = ({
  viewMode,
  setViewMode,
  onExport,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Optimized Leads Management</h1>
        <p className="text-gray-600">High-performance lead management with virtualization and caching</p>
      </div>
      <div className="flex space-x-2">
        <Button
          variant={viewMode === 'infinite' ? 'default' : 'outline'}
          onClick={() => setViewMode('infinite')}
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Infinite Scroll
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>
    </div>
  );
};
