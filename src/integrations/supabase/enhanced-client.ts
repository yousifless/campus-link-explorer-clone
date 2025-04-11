
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Create a single Supabase client for all database operations
const supabaseUrl = "https://gdkvqvodqbzunzwfvcgh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs";

// Create a strongly typed client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Use the client directly for operations instead of using the db object
// This is simpler and avoids type issues
