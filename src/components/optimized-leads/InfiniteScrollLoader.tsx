
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface InfiniteScrollLoaderProps {
  loadMoreRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  hasMore: boolean;
}

export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({
  loadMoreRef,
  isLoading,
  hasMore,
}) => {
  return (
    <div ref={loadMoreRef} className="py-4">
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
      {!hasMore && !isLoading && (
        <p className="text-center text-gray-500">No more leads to load</p>
      )}
    </div>
  );
};
