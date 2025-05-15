export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          avatar_signed_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          avatar_signed_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          avatar_signed_url?: string | null
          website?: string | null
        }
      }
      profile_embeddings: {
        Row: {
          id: number;
          user_id: string;
          embedding: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          embedding: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          embedding?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_embeddings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_match_preferences: {
        Row: {
          id: number;
          user_id: string;
          location: number;
          interests: number;
          languages: number;
          goals: number;
          availability: number;
          personality: number;
          network: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          location?: number;
          interests?: number;
          languages?: number;
          goals?: number;
          availability?: number;
          personality?: number;
          network?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          location?: number;
          interests?: number;
          languages?: number;
          goals?: number;
          availability?: number;
          personality?: number;
          network?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_match_preferences_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      club_resources: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          description: string | null;
          type: string;
          url: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          description?: string | null;
          type: string;
          url: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          description?: string | null;
          type?: string;
          url?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_resources_club_id_fkey";
            columns: ["club_id"];
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_resources_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    }
    Functions: {
      match_profiles_by_embedding: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_limit: number;
        };
        Returns: {
          id: string;
          similarity: number;
        }[];
      };
    };
  }
} 