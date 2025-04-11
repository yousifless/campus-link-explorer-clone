
import { MatchType, SuggestedMatchType } from '@/types/database';

export type MatchingContextType = {
  matches: MatchType[];
  suggestedMatches: SuggestedMatchType[];
  loading: boolean;
  fetchMatches: () => Promise<void>;
  fetchSuggestedMatches: () => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  createMatch: (userId: string) => Promise<void>;
};
