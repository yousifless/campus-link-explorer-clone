import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Create a single Supabase client for all database operations
const supabaseUrl = "https://gdkvqvodqbzunzwfvcgh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs";

// Create a strongly typed client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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
  languages: () => supabase.from('languages')
};
