/**
 * SimpleCache - A utility to cache data and reduce repeated requests
 * 
 * Features:
 * - Time-based cache expiration
 * - Automatic cleanup of expired entries
 * - Configurable cache duration per entry
 */
class SimpleCache {
  private cache: Map<string, { data: any, timestamp: number, ttl: number }> = new Map();
  
  /**
   * Get an item from the cache
   * @param key The cache key
   * @returns The cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * Set an item in the cache
   * @param key The cache key
   * @param data The data to cache
   * @param ttl Time to live in milliseconds (default: 30 seconds)
   */
  set<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Remove an item from the cache
   * @param key The cache key
   */
  remove(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const cache = new SimpleCache(); 