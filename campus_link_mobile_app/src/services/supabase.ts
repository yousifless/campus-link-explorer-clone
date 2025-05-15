// Supabase credentials are loaded from app.config.js via expo-constants for all platforms.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get Supabase credentials from app config (always present now)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

console.log('Loaded Supabase URL from Constants:', Constants.expoConfig?.extra?.supabaseUrl);
console.log('Loaded Supabase URL from process.env:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Final Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing. Please check your app.config.js.');
}
if (supabaseUrl === 'https://example.supabase.co') {
  throw new Error('Supabase URL is still the placeholder! Please check your config and restart Expo.');
}

// Configure Supabase client based on platform
const clientOptions = {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

export default supabase;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey?.slice(0, 10));
console.log('Loaded Supabase URL from Constants:', Constants.expoConfig?.extra?.supabaseUrl);
console.log('Loaded Supabase URL from process.env:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Final Supabase URL:', supabaseUrl);