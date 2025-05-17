
export interface MatchUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  student_type?: string;
  university_id?: string;
  major_id?: string;
  bio?: string;
  languages?: { id: string; name: string; proficiency: string }[];
  interests?: { id: string; name: string }[];
}

export interface MatchType {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'unmatched';
  user1_status?: string;
  user2_status?: string;
  created_at: string;
  updated_at: string;
  initiator_id?: string;
  otherUser: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    university?: string | null;
    student_type?: string | null;
    major?: string | null;
    bio?: string | null;
    nationality?: string | null;
    is_verified?: boolean;
    common_interests?: number;
    common_languages?: number;
    match_score?: number;
  };
}

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'unmatched';

export interface MatchingContextType {
  matches: MatchType[];
  pendingMatches: MatchType[];
  acceptedMatches: MatchType[];
  loading: boolean;
  error: Error | null;
  fetchMatches: () => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  unmatchUser: (matchId: string) => Promise<void>;
  getMatchById: (matchId: string) => MatchType | undefined;
  getMatchByUserId: (userId: string) => MatchType | undefined;
}

export interface ConversationType {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
  user1_id: string;
  user2_id: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  content?: any;
  is_read: boolean;
  read?: boolean;
  related_id: string;
  created_at: string;
}

export interface CoffeeMeetupLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CoffeeMeetup {
  id: string;
  match_id: string;
  sender_id: string;
  receiver_id: string;
  date: string;
  location: CoffeeMeetupLocation;
  location_name?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  conversation_starter?: string;
  additional_notes?: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
  sender?: MatchUser;
  receiver?: MatchUser;
}

// Message type for conversations
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}
