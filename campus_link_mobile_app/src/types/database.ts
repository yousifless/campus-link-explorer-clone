export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url?: string;
  university_id?: string;
  major_id?: string;
  student_type?: 'international' | 'local';
  bio?: string;
  interests?: string[];
  languages?: string[];
  nationality?: string;
  is_verified?: boolean;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  otherUser: UserProfile;
  match_score?: number;
}

export interface Meetup {
  id: string;
  sender_id: string;
  receiver_id: string;
  date: string;
  location_name: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  sender: UserProfile;
  receiver: UserProfile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  other_user: UserProfile;
} 