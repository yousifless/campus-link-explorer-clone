/**
 * RequestManager - A utility to manage API requests and prevent overwhelming the browser
 * 
 * Features:
 * - Limits concurrent requests
 * - Implements cooldown periods between requests
 * - Provides retry logic with exponential backoff
 * - Prevents duplicate requests for the same resource
 */
import { supabase } from '@/integrations/supabase/client';

class RequestManager {
  private activeRequests: Map<string, Promise<any>> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private maxConcurrentRequests: number = 2; // Reduce this to avoid resource exhaustion
  private cooldownTime: number = 5000; // Increase cooldown to 5 seconds
  private cacheTime: number = 30000; // Cache for 30 seconds

  /**
   * Execute a request with throttling and cooldown
   * @param key Unique identifier for the request
   * @param requestFn The actual request function to execute
   * @param options Additional options for the request
   * @returns Promise with the request result
   */
  async request<T>(
    key: string, 
    requestFn: () => Promise<T>,
    options: { 
      priority?: number,
      forceRefresh?: boolean,
      useCache?: boolean 
    } = { useCache: true }
  ): Promise<T> {
    // Check cache first if enabled
    if (options.useCache !== false) {
      const cachedData = this.getFromCache(key);
      if (cachedData && !options.forceRefresh) {
        console.log(`Using cached data for ${key}`);
        return cachedData;
      }
    }

    // Check if we're in cooldown
    const cooldownUntil = this.cooldowns.get(key);
    if (cooldownUntil && Date.now() < cooldownUntil && !options.forceRefresh) {
      console.log(`Request for ${key} is in cooldown, using cache if available`);
      
      // Try to return cached data even if expired
      const cachedData = this.getFromCache(key, true);
      if (cachedData) {
        console.log(`Using stale cached data for ${key} during cooldown`);
        return cachedData;
      }
      
      throw new Error('Request in cooldown');
    }

    // Check if this request is already in progress
    if (this.activeRequests.has(key) && !options.forceRefresh) {
      console.log(`Request for ${key} already in progress, returning existing promise`);
      return this.activeRequests.get(key) as Promise<T>;
    }

    // Check if we have too many active requests
    if (this.activeRequests.size >= this.maxConcurrentRequests) {
      console.log(`Too many concurrent requests (${this.activeRequests.size}), using cache for ${key}`);
      
      // Try to return cached data even if expired
      const cachedData = this.getFromCache(key, true);
      if (cachedData) {
        console.log(`Using stale cached data for ${key} due to request limit`);
        return cachedData;
      }
      
      // If no cache, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.request(key, requestFn, options);
    }

    // Execute the request
    const requestPromise = (async () => {
      try {
        console.log(`Starting request: ${key}`);
        const result = await requestFn();
        console.log(`Request completed: ${key}`);
        
        // Cache the result
        if (options.useCache !== false) {
          this.saveToCache(key, result);
        }
        
        return result;
      } catch (error) {
        console.error(`Request failed: ${key}`, error);
        throw error;
      } finally {
        this.activeRequests.delete(key);
        // Set cooldown to prevent immediate re-requests
        this.cooldowns.set(key, Date.now() + this.cooldownTime);
        setTimeout(() => {
          this.cooldowns.delete(key);
        }, this.cooldownTime);
      }
    })();

    this.activeRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Execute a request with retry logic and exponential backoff
   * @param key Unique identifier for the request
   * @param requestFn The actual request function to execute
   * @param options Retry options
   * @returns Promise with the request result
   */
  async requestWithRetry<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      maxRetries?: number,
      initialDelay?: number
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, initialDelay = 1000 } = options;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(key, requestFn);
      } catch (error) {
        if (error.message === 'Request in cooldown' || attempt === maxRetries) {
          throw error;
        }
        
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} for ${key} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the throw in the loop
    throw new Error('Request failed after all retry attempts');
  }

  private getFromCache(key: string, allowExpired: boolean = false): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTime;
    if (isExpired && !allowExpired) {
      return null;
    }
    
    return cached.data;
  }
  
  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

export const requestManager = new RequestManager(); 