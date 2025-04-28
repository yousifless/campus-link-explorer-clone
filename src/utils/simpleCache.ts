interface CacheItem<T> {
  value: T;
  expiry: number | null;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const simpleCache = new SimpleCache(); 