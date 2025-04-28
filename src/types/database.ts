// Extended database types to complement the auto-generated Supabase types
export type MatchType = {
  id: string;
  created_at: string;
  updated_at: string;
  user1_id: string;
  user2_id: string;
  status: string;
  user1_status: string;
  user2_status: string;
  match_score: number;
  otherUser: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    university: string;
    student_type: string;
    major: string;
    bio: string;
    nationality: string;
    is_verified: boolean;
    common_interests: number;
    common_languages: number;
    year_of_study?: number;
    location?: string;
    cultural_insight?: string;
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

export interface ConversationType {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  otherUser?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  is_placeholder?: boolean;
  last_message?: MessageType;
}

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
  first_name: string;
  last_name: string;
  nickname?: string | null;
  bio?: string | null;
  nationality?: string | null;
  year_of_study?: number | null;
  university_id?: string | null;
  campus_id?: string | null;
  major_id?: string | null;
  student_type?: 'international' | 'local' | null;
  cultural_insight?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  interests: string[];
  languages: {
    id: string;
    proficiency: string;
  }[];
  university?: {
    id: string;
    name: string;
  } | null;
  campus?: {
    id: string;
    name: string;
  } | null;
};

export type LanguageType = {
  id: string;
  name: string;
  code: string;
};

export type InterestType = {
  id: string;
  name: string;
  category: string;
};

export type UserLanguageType = {
  id: string;
  user_id: string;
  language_id: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
  created_at: string;
};

export type UserInterestType = {
  id: string;
  user_id: string;
  interest_id: string;
  created_at: string;
};

export type UniversityType = {
  id: string;
  name: string;
  location: string;
  type: string;
};

export type CampusType = {
  id: string;
  university_id: string;
  name: string;
  address: string;
};

export type MajorType = {
  id: string;
  name: string;
  field_of_study: string;
};

// Deal types for the Local Deals feature
export type DealType = {
  id: string;
  business_name: string;
  category: string;
  discount_percentage: number;
  description: string;
  expiration_date: string;
  image_url: string | null;
  location: string;
  is_exclusive: boolean;
  redemption_code: string;
  average_rating: number;
  review_count: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type DealReviewType = {
  id: string;
  deal_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
};

// Meetup types for the Coffee Meetup Scheduler
export type MeetupType = {
  id: string;
  creator_id: string;
  invitee_id: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed' | 'sipped';
  proposed_date: string;
  proposed_time: string;
  location_name: string | null;
  location_address: string | null;
  notes: string | null;
  created_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  creator?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  invitee?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
};

export type MatchesWithProfilesView = {
  id: string;
  created_at: string;
  updated_at: string;
  user1_id: string;
  user2_id: string;
  status: string;
  user1_status: string;
  user2_status: string;
  user1_first_name: string | null;
  user1_last_name: string | null;
  user1_avatar_url: string | null;
  user1_university: string | null;
  user1_student_type: string | null;
  user1_major: string | null;
  user1_bio: string | null;
  user1_nationality: string | null;
  user1_is_verified: boolean;
  user2_first_name: string | null;
  user2_last_name: string | null;
  user2_avatar_url: string | null;
  user2_university: string | null;
  user2_student_type: string | null;
  user2_major: string | null;
  user2_bio: string | null;
  user2_nationality: string | null;
  user2_is_verified: boolean;
};

// Please note that this file is getting quite large and could be split into
// multiple domain-specific type files in the future.
