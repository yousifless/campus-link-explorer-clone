
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
    }
  }
}

export interface ProfileType {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  bio: string | null;
  nationality: string | null;
  year_of_study: number | null;
  university_id: string | null;
  campus_id: string | null;
  major_id: string | null;
  student_type: 'international' | 'local' | null;
  cultural_insight: string | null;
  location: string | null;
  avatar_url: string | null;
  avatar_signed_url?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  interests: string[];
  languages: { id: string; proficiency: string }[];
  university: { id: string; name: string } | null;
  campus: { id: string; name: string } | null;
}

export interface MeetupType {
  id: string;
  title: string;
  description: string;
  date: string;
  location_name: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  creator_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  creator?: ProfileType;
  invitee?: ProfileType;
}

export interface Language {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Major {
  id: string;
  name: string;
  field_of_study: string;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  location: string;
  country: string;
  type: string;
  campus?: string;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: string;
  name: string;
  address: string;
  university_id: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: 'match' | 'message';
  title: string;
  message: string;
  content: string;
  user_id: string;
  related_id?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  created_at: string;
  is_read: boolean;
  read: boolean;
  data?: any;
  match_percentage?: number;
}
