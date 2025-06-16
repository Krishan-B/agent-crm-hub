
import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
}

export const useVirtualization = <T>(
  items: T[],
  config: VirtualizationConfig
) => {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const overscanStart = Math.max(0, startIndex - overscan);
    const overscanEnd = Math.min(items.length - 1, endIndex + overscan);

    const virtualItems: VirtualItem[] = [];
    for (let i = overscanStart; i <= overscanEnd; i++) {
      virtualItems.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
      });
    }

    return virtualItems;
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    getItemData: (index: number) => items[index],
  };
};
