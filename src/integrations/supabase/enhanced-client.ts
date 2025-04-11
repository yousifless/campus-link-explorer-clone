
import { supabase } from './client';
import { DatabaseTables } from '@/types/database';

// Define a function to interact with specific tables with proper typing
export function fromTable<T extends keyof DatabaseTables>(table: T) {
  return supabase
    .from(table as string)
    .returns<DatabaseTables[T]>();
}

// Extend original client with convenience methods for each table
export const db = {
  profiles: () => fromTable('profiles'),
  matches: () => fromTable('matches'),
  conversations: () => fromTable('conversations'),
  messages: () => fromTable('messages'),
  notifications: () => fromTable('notifications'),
  user_interests: () => fromTable('user_interests'),
  user_languages: () => fromTable('user_languages'),
  universities: () => fromTable('universities'),
  campuses: () => fromTable('campuses'),
  majors: () => fromTable('majors'),
  interests: () => fromTable('interests'),
  languages: () => fromTable('languages'),
};

export { supabase };
