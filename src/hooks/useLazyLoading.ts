
import { useState, useEffect, useCallback, useRef } from 'react';
import { leadsCache } from '@/utils/cache';

interface LazyLoadingConfig {
  pageSize: number;
  threshold?: number;
  cacheKey?: string;
}

interface LazyLoadingResult<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  error: string | null;
}

export const useLazyLoading = <T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  config: LazyLoadingConfig
): LazyLoadingResult<T> => {
  const { pageSize, threshold = 0.8, cacheKey } = config;
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const mountedRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const cachedKey = cacheKey ? `${cacheKey}_page_${page}` : null;
    let cachedData = null;

    if (cachedKey) {
      cachedData = leadsCache.get(cachedKey);
      if (cachedData) {
        setItems(prev => [...prev, ...cachedData.data]);
        setHasMore(cachedData.hasMore);
        setPage(prev => prev + 1);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, pageSize);
      
      if (!mountedRef.current) return;

      if (cachedKey) {
        leadsCache.set(cachedKey, result);
      }

      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFunction, page, pageSize, isLoading, hasMore, cacheKey]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    items,
    isLoading,
    hasMore,
    loadMore,
    reset,
    error,
  };
};

// Intersection Observer hook for automatic loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};
