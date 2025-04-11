
// Extended database types to complement the auto-generated Supabase types
export type MatchType = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  user1_status: string;
  user2_status: string;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    university: string | null;
    student_type: string | null;
    major: string | null;
    bio: string | null;
    common_interests: number;
    common_languages: number;
    match_score: number;
  };
};

export type SuggestedMatchType = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  university: string | null;
  student_type: string | null;
  bio: string | null;
  major: string | null;
  avatar_url?: string | null;
  common_interests: number;
  common_languages: number;
  match_score: number;
};

export type MessageType = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
};

export type ConversationType = {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  last_message?: MessageType;
};

export type NotificationType = {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
};

export type ProfileType = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  university: string | null;
  campus_id: string | null;
  major_id: string | null;
  bio: string | null;
  avatar_url: string | null;
  student_type: 'international' | 'local' | null;
  year_of_study: number | null;
  nationality: string | null;
  is_verified: boolean;
  interests: string[] | null;
  languages: string[] | null;
};

export type University = {
  id: string;
  name: string;
  location: string;
  type: string;
};

export type Campus = {
  id: string;
  university_id: string;
  name: string;
  address: string;
};

export type Major = {
  id: string;
  name: string;
  field_of_study: string;
};

export type Language = {
  id: string;
  name: string;
  code: string;
};

export type Interest = {
  id: string;
  name: string;
  category: string;
};

export type UserLanguage = {
  language_id: string;
  proficiency: string;
};

// Database tables definition for use with the enhanced client
export interface DatabaseTables {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    university: string | null;
    campus_id: string | null;
    major_id: string | null;
    student_type: 'international' | 'local' | null;
    year_of_study: number | null;
    nationality: string | null;
    is_verified: boolean | null;
    created_at: string;
    updated_at: string;
  };
  matches: {
    id: string;
    user1_id: string;
    user2_id: string;
    status: string;
    user1_status: string;
    user2_status: string;
    created_at: string;
    updated_at: string;
  };
  conversations: {
    id: string;
    match_id: string;
    created_at: string;
    updated_at: string;
  };
  messages: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
  };
  notifications: {
    id: string;
    user_id: string;
    type: string;
    content: string;
    is_read: boolean;
    related_id: string | null;
    created_at: string;
  };
  user_interests: {
    id: string;
    user_id: string;
    interest_id: string;
    created_at: string;
  };
  user_languages: {
    id: string;
    user_id: string;
    language_id: string;
    proficiency: string;
    created_at: string;
  };
  universities: {
    id: string;
    name: string;
    location: string;
    country: string;
    type: string;
    website: string | null;
    created_at: string;
    updated_at: string;
  };
  campuses: {
    id: string;
    university_id: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
  };
  majors: {
    id: string;
    name: string;
    field_of_study: string;
    created_at: string;
  };
  interests: {
    id: string;
    name: string;
    category: string | null;
    created_at: string;
  };
  languages: {
    id: string;
    name: string;
    code: string;
    created_at: string;
  };
}
