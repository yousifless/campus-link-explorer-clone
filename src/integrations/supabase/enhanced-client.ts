
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = "https://gdkvqvodqbzunzwfvcgh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs";

// Track pending requests to manage concurrency
let pendingRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue: Array<() => Promise<void>> = [];

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
      setTimeout(processingRequest, 500); // Process next request after a delay
    }
  }
};

// Custom fetch implementation with improved request throttling and queuing
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      // Randomized delay between 300-800ms to prevent concurrent requests
      const delay = Math.floor(Math.random() * 500) + 300;
      await new Promise(r => setTimeout(r, delay));
      
      try {
        const response = await fetch(input, init);
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
  // For now, we'll use the generic version of the from method for tables that aren't in the types yet
  deals: () => supabase.from('deals' as any),
  dealReviews: () => supabase.from('deal_reviews' as any),
  meetups: () => supabase.from('meetups' as any)
};
