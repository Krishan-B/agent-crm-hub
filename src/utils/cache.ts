
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private storage: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.storage.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.storage.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  has(key: string): boolean {
    const item = this.storage.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.storage.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.storage.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.storage.delete(key);
      }
    }
  }

  // Add pattern-based invalidation
  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.storage.keys()) {
      if (regex.test(key)) {
        this.storage.delete(key);
      }
    }
  }
}

// Global cache instances
export const dataCache = new Cache();
export const searchCache = new Cache();
export const userCache = new Cache();
export const leadsCache = new Cache();
export const dashboardCache = new Cache();

// Auto cleanup every 5 minutes
setInterval(() => {
  dataCache.cleanup();
  searchCache.cleanup();
  userCache.cleanup();
  leadsCache.cleanup();
  dashboardCache.cleanup();
}, 5 * 60 * 1000);
