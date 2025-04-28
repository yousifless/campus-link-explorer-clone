export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  interests: string[];
  languages: string[];
  bio: string | null;
  nickname: string | null;
  cultural_insight: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  interests: string[];
  languages: string[];
  bio: string | null;
  nickname: string | null;
  cultural_insight: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
} 