import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Extend the Database interface to include our custom tables
declare global {
  namespace Database {
    interface PublicSchema {
      club_resources: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          description: string | null;
          type: 'link' | 'file' | 'document';
          url: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          description?: string | null;
          type: 'link' | 'file' | 'document';
          url: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          description?: string | null;
          type?: 'link' | 'file' | 'document';
          url?: string;
          created_by?: string;
          created_at?: string;
        };
      };
    }
  }
}

// Re-export the Database type
export type { Database };

// Typed version of the Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;

// Helper function to assert types in queries
export function typedSupabase(client: any): TypedSupabaseClient {
  return client as TypedSupabaseClient;
} 