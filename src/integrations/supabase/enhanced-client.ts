
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = "https://gdkvqvodqbzunzwfvcgh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  global: {
    fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Add an adaptive backoff mechanism with randomized jitter to prevent rate limiting
      const delay = Math.floor(Math.random() * 150) + 100; // Random delay between 100-250ms
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const response = await fetch(input, init);
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    }
  }
});

// Enhance the profiles table type to include nickname and cultural_insight
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

// Create a db object that provides helper methods for common database operations
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
  // This is a temporary solution until we update the Supabase schema
  deals: () => supabase.from('deals' as any),
  dealReviews: () => supabase.from('deal_reviews' as any),
  meetups: () => supabase.from('meetups' as any)
};
