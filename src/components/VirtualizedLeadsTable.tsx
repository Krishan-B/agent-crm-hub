
import React, { useMemo } from 'react';
import { useVirtualization } from '@/hooks/useVirtualization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Phone, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Lead } from '@/hooks/useOptimizedLeads';

interface VirtualizedLeadsTableProps {
  leads: Lead[];
  selectedLeads: string[];
  onSelectLead: (leadId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  containerHeight?: number;
}

const ITEM_HEIGHT = 80; // Height of each row in pixels

export const VirtualizedLeadsTable: React.FC<VirtualizedLeadsTableProps> = ({
  leads,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  containerHeight = 600,
}) => {
  const {
    visibleItems,
    totalHeight,
    handleScroll,
    getItemData,
  } = useVirtualization(leads, {
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    overscan: 5,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const allSelected = useMemo(() => 
    leads.length > 0 && selectedLeads.length === leads.length,
    [leads.length, selectedLeads.length]
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      
      <div 
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <Table>
            <TableBody>
              {visibleItems.map((virtualItem) => {
                const lead = getItemData(virtualItem.index);
                if (!lead) return null;

                return (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-gray-50 absolute w-full"
                    style={{
                      height: ITEM_HEIGHT,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <TableCell className="w-12">
                      <Checkbox 
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => onSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{lead.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{lead.email}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(lead.balance)}</TableCell>
                    <TableCell>{lead.country}</TableCell>
                    <TableCell className="max-w-32 truncate">
                      {lead.assigned_agent ? 
                        `${lead.assigned_agent.first_name} ${lead.assigned_agent.last_name}` : 
                        'Unassigned'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
