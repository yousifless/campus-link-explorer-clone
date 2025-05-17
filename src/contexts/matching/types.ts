
export interface MatchUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  university?: string | null;
  student_type?: string | null;
  major?: string | null;
  bio?: string | null;
  nationality?: string | null;
  is_verified?: boolean;
  common_interests?: number;
  common_languages?: number;
  match_score?: number;
}

export interface MatchType {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'unmatch';
  user1_status?: string;
  user2_status?: string;
  created_at: string;
  updated_at?: string;
  initiator_id?: string;
  otherUser: MatchUser;
}

export interface MatchingContextProps {
  matches: MatchType[];
  pendingMatches: MatchType[];
  acceptedMatches: MatchType[];
  loading: boolean;
  error: Error | null;
  fetchMatches: () => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  declineMatch: (matchId: string) => Promise<void>;
  unmatchUser: (matchId: string) => Promise<void>;
  getMatchByUserId: (userId: string) => MatchType | undefined;
}

export interface CoffeeMeetupLocation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}
