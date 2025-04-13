
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
  nickname: string | null;
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
  cultural_insight: string | null;
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
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
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

// Please note that this file is getting quite large and could be split into
// multiple domain-specific type files in the future.
