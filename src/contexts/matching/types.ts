
import { ProfileType } from '@/types/database';

export type MatchStatus = 'pending' | 'accepted' | 'rejected';

export interface MatchType {
  id: string;
  created_at: string;
  updated_at: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  initiator_id: string;
  user1_status: string;
  user2_status: string;
  user1?: ProfileType;
  user2?: ProfileType;
  otherUser: any; // Add the missing property
}

export interface MatchingContextType {
  matches: MatchType[];
  possibleMatches: MatchType[];
  myPendingMatches: MatchType[];
  theirPendingMatches: MatchType[];
  suggestedMatches?: any[]; // Add suggestedMatches property
  loading: boolean;
  fetchMatches: () => Promise<void>;
  fetchSuggestedMatches?: () => Promise<void>; // Add fetchSuggestedMatches property
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<void>;
  createMatch: (userId: string) => Promise<void>;
}
