
import { useMemo } from 'react';
import { leadsCache, searchCache } from '@/utils/cache';
import { LeadFilters } from './useLeadsFilters';

export const useLeadsCache = (filters: LeadFilters, currentPage: number, pageSize: number) => {
  const cacheKey = useMemo(() => {
    const filterString = JSON.stringify(filters);
    return `leads_${currentPage}_${pageSize}_${btoa(filterString)}`;
  }, [filters, currentPage, pageSize]);

  const getCachedData = (key: string) => {
    return leadsCache.get(key);
  };

  const setCachedData = (key: string, data: any) => {
    leadsCache.set(key, data);
  };

  const clearCache = () => {
    leadsCache.clear();
    searchCache.clear();
  };

  const invalidateCache = () => {
    leadsCache.invalidateByPattern('leads_.*');
  };

  return {
    cacheKey,
    getCachedData,
    setCachedData,
    clearCache,
    invalidateCache,
  };
};
