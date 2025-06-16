
import { useState } from 'react';

export interface LeadFilters {
  search: string;
  status: string;
  country: string;
  source: string;
  assignedAgent: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
}

export const useLeadsFilters = () => {
  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    status: 'all',
    country: 'all',
    source: 'all',
    assignedAgent: 'all',
    dateRange: {}
  });

  return {
    filters,
    setFilters,
  };
};
