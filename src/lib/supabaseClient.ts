import { createClient } from '@supabase/supabase-js';

// Use environment variables if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gdkvqvodqbzunzwfvcgh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdka3Zxdm9kcWJ6dW56d2Z2Y2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTMwMjEsImV4cCI6MjA1OTY2OTAyMX0.V1YctsUhIOpnvKYdCQVX9n4EBBVxQito7tLDeEO0gYs';

// Log configuration for debugging (remove in production)
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase key defined:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log("Supabase connection test:", error ? "Failed" : "Successful");
    if (error) console.error("Connection error:", error);
  } catch (e) {
    console.error("Supabase connection exception:", e);
  }
};

testConnection(); 