
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { DatabaseTables } from '@/types/database';

// Create a single Supabase client for all database operations
const supabaseUrl = "https://gdkvqvodqbzunzwfvcgh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs";

// Create a strongly typed client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Use the same client for direct access to tables
export const db = {
  // Use direct table access instead of wrapper functions
  profiles: () => supabase.from('profiles'),
  matches: () => supabase.from('matches'),
  conversations: () => supabase.from('conversations'),
  messages: () => supabase.from('messages'),
  notifications: () => supabase.from('notifications'),
  user_interests: () => supabase.from('user_interests'),
  user_languages: () => supabase.from('user_languages'),
  universities: () => supabase.from('universities'),
  campuses: () => supabase.from('campuses'),
  majors: () => supabase.from('majors'),
  interests: () => supabase.from('interests'),
  languages: () => supabase.from('languages'),
};
