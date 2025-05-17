import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Use environment variables if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gdkvqvodqbzunzwfvcgh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs';

// Log configuration for debugging (remove in production)
console.log("Supabase URL (enhanced-client.ts):", supabaseUrl);
console.log("Supabase key defined (enhanced-client.ts):", !!supabaseKey);

// Track pending requests to manage concurrency
let pendingRequests = 0;
const MAX_CONCURRENT_REQUESTS = 2;
const requestQueue: Array<() => Promise<void>> = [];
const requestDelays = new Map<string, number>();

const processingRequest = async () => {
  if (pendingRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }
  
  const nextRequest = requestQueue.shift();
  if (nextRequest) {
    pendingRequests++;
    try {
      await nextRequest();
    } catch (error) {
      console.error("Request error:", error);
    } finally {
      pendingRequests--;
      setTimeout(processingRequest, 800);
    }
  }
};

// Custom fetch implementation with improved request throttling and queuing
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      // Get the endpoint from the URL
      let endpoint: string;
      if (typeof input === 'string') {
        endpoint = new URL(input).pathname;
      } else if (input instanceof URL) {
        endpoint = input.pathname;
      } else {
        endpoint = new URL(input.url).pathname;
      }
      
      // Calculate delay based on endpoint and previous requests
      const baseDelay = requestDelays.get(endpoint) || 500;
      const randomFactor = Math.random() * 0.5 + 0.75; // Random factor between 0.75 and 1.25
      const delay = Math.floor(baseDelay * randomFactor);
      
      // Update the delay for this endpoint (increase if it's a frequently used endpoint)
      requestDelays.set(endpoint, Math.min(baseDelay * 1.2, 2000));
      
      // Apply the delay
      await new Promise(r => setTimeout(r, delay));
      
      try {
        const response = await fetch(input, init);
        
        // If the request was successful, gradually decrease the delay
        if (response.ok) {
          const currentDelay = requestDelays.get(endpoint) || 500;
          requestDelays.set(endpoint, Math.max(currentDelay * 0.9, 300));
        }
        
        resolve(response);
      } catch (error) {
        console.error('Fetch error:', error);
        reject(error);
      }
    };

    // Add request to queue
    requestQueue.push(executeRequest);
    
    // Try to process the queue
    processingRequest();
  });
};

/**
 * Enhanced client with additional utilities for common Supabase operations
 */
export class EnhancedSupabaseClient {
  private client: SupabaseClient;
  
  constructor(client: SupabaseClient) {
    this.client = client;
  }
  
  /**
   * Fetch personality traits for a user
   */
  async fetchPersonalityTraits(userId: string) {
    try {
      // Instead of directly accessing personality_traits table which might not exist yet,
      // let's use a safer approach by using an RPC function or checking if the table exists first
      const { data: tableExists } = await this.client.rpc('check_table_exists', { 
        table_name: 'personality_traits' 
      });
      
      if (tableExists) {
        const { data, error } = await this.client
          .rpc('get_user_personality_traits', { user_id_param: userId });
          
        if (error) throw error;
        return data || [];
      }
      
      // Return empty array if table doesn't exist
      return [];
    } catch (error) {
      console.error('Error fetching personality traits:', error);
      return [];
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  global: {
    fetch: customFetch
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Enhanced profiles table type
export type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  university: string | null;
  campus_id: string | null;
  major_id: string | null;
  bio: string | null;
  avatar_url: string | null;
  student_type: 'international' | 'local' | null;
  year_of_study: number | null;
  nationality: string | null;
  is_verified: boolean;
  cultural_insight: string | null;
};

// Database helper methods
export const db = {
  profiles: () => supabase.from('profiles'),
  matches: () => supabase.from('matches'),
  conversations: () => supabase.from('conversations'),
  messages: () => supabase.from('messages'),
  notifications: () => supabase.from('notifications'),
  userInterests: () => supabase.from('user_interests'),
  userLanguages: () => supabase.from('user_languages'),
  universities: () => supabase.from('universities'),
  campuses: () => supabase.from('campuses'),
  majors: () => supabase.from('majors'),
  interests: () => supabase.from('interests'),
  languages: () => supabase.from('languages'),
  personalityTraits: () => supabase.from('personality_traits'),
  // For now, we'll use the generic version of the from method for tables that aren't in the types yet
  deals: () => supabase.from('deals' as any),
  dealReviews: () => supabase.from('deal_reviews' as any),
  meetups: () => supabase.from('meetups' as any)
};
