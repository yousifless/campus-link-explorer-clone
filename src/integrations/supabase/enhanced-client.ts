
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { DatabaseTables } from '@/types/database';

// Create a strongly typed client
export const supabase = createClient<Database>(
  "https://gdkvqvodqbzunzwfvcgh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs"
);

// Use the raw client for direct API calls
const rawClient = createClient(
  "https://gdkvqvodqbzunzwfvcgh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs"
);

// Type-safe helper functions that return properly typed query builders
export const db = {
  profiles: () => rawClient.from('profiles'),
  matches: () => rawClient.from('matches'),
  conversations: () => rawClient.from('conversations'),
  messages: () => rawClient.from('messages'),
  notifications: () => rawClient.from('notifications'),
  user_interests: () => rawClient.from('user_interests'),
  user_languages: () => rawClient.from('user_languages'),
  universities: () => rawClient.from('universities'),
  campuses: () => rawClient.from('campuses'),
  majors: () => rawClient.from('majors'),
  interests: () => rawClient.from('interests'),
  languages: () => rawClient.from('languages'),
};
