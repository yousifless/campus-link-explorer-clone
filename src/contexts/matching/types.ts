
import { ProfileType, SuggestedMatchType } from '@/types/database';

export type MatchStatus = 'pending' | 'accepted' | 'rejected';

export interface MatchType {
  id: string;
  created_at: string;
  updated_at: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  initiator_id?: string; // Made optional since it may not be present in all cases
  user1_status: string;
  user2_status: string;
  user1?: ProfileType;
  user2?: ProfileType;
  otherUser: any; // This contains the other user's profile data
}

export interface MatchingContextType {
  matches: MatchType[];
  possibleMatches: MatchType[];
  myPendingMatches: MatchType[];
  theirPendingMatches: MatchType[];
  suggestedMatches?: SuggestedMatchType[]; // Using the proper type from database.ts
  loading: boolean;
  fetchMatches: () => Promise<void>;
  fetchSuggestedMatches?: () => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: MatchStatus) => Promise<void>;
  createMatch: (userId: string) => Promise<void>;
}
