
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

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
    first_name: string;
    last_name: string;
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

type SuggestedMatchType = {
  id: string;
  first_name: string;
  last_name: string;
  university: string | null;
  student_type: string | null;
  bio: string | null;
  major: string | null;
  avatar_url?: string | null;
  common_interests: number;
  common_languages: number;
  match_score: number;
};

type MatchingContextType = {
  matches: MatchType[];
  suggestedMatches: SuggestedMatchType[];
  loading: boolean;
  fetchMatches: () => Promise<void>;
  fetchSuggestedMatches: () => Promise<void>;
  createMatch: (otherUserId: string) => Promise<void>;
  respondToMatch: (matchId: string, response: 'accept' | 'reject') => Promise<void>;
};

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedMatchType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Get matches where user is either user1 or user2
      const { data: user1Matches, error: error1 } = await supabase
        .from('matches')
        .select(`
          id, user1_id, user2_id, status, user1_status, user2_status, created_at, updated_at,
          user2:profiles!matches_user2_id_fkey(
            id, first_name, last_name, avatar_url, universities(name), student_type, majors(name), bio
          )
        `)
        .eq('user1_id', user.id);

      if (error1) throw error1;

      const { data: user2Matches, error: error2 } = await supabase
        .from('matches')
        .select(`
          id, user1_id, user2_id, status, user1_status, user2_status, created_at, updated_at,
          user1:profiles!matches_user1_id_fkey(
            id, first_name, last_name, avatar_url, universities(name), student_type, majors(name), bio
          )
        `)
        .eq('user2_id', user.id);

      if (error2) throw error2;

      // Process and combine matches
      const processedUser1Matches = user1Matches.map((match) => ({
        ...match,
        otherUser: {
          id: match.user2.id,
          first_name: match.user2.first_name,
          last_name: match.user2.last_name,
          avatar_url: match.user2.avatar_url,
          university: match.user2.universities?.name,
          student_type: match.user2.student_type,
          major: match.user2.majors?.name,
          bio: match.user2.bio,
          common_interests: 0, // We don't have this info here
          common_languages: 0, // We don't have this info here
          match_score: 0, // We don't have this info here
        }
      }));

      const processedUser2Matches = user2Matches.map((match) => ({
        ...match,
        otherUser: {
          id: match.user1.id,
          first_name: match.user1.first_name,
          last_name: match.user1.last_name,
          avatar_url: match.user1.avatar_url,
          university: match.user1.universities?.name,
          student_type: match.user1.student_type,
          major: match.user1.majors?.name,
          bio: match.user1.bio,
          common_interests: 0, // We don't have this info here
          common_languages: 0, // We don't have this info here
          match_score: 0, // We don't have this info here
        }
      }));

      setMatches([...processedUser1Matches, ...processedUser2Matches]);
    } catch (error: any) {
      toast({
        title: "Error fetching matches",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedMatches = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Use the custom function to get potential matches
      const { data, error } = await supabase
        .rpc('get_potential_matches', { user_id: user.id, limit_count: 20 });

      if (error) throw error;

      // Process matches to match the SuggestedMatchType
      const processedMatches = data.map((match: any) => ({
        id: match.id,
        first_name: match.first_name,
        last_name: match.last_name,
        university: match.university,
        student_type: match.student_type,
        bio: match.bio,
        major: match.major,
        common_interests: match.common_interests,
        common_languages: match.common_languages,
        match_score: match.match_score
      }));

      setSuggestedMatches(processedMatches);
    } catch (error: any) {
      toast({
        title: "Error fetching suggested matches",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (otherUserId: string) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");

      // Determine user1_id and user2_id (smaller ID first for consistency)
      const user1_id = user.id < otherUserId ? user.id : otherUserId;
      const user2_id = user.id < otherUserId ? otherUserId : user.id;

      // Create match
      const { data, error } = await supabase
        .from('matches')
        .insert({
          user1_id,
          user2_id,
          status: 'pending',
          user1_status: user.id === user1_id ? 'accepted' : 'pending',
          user2_status: user.id === user2_id ? 'accepted' : 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Also create a conversation for this match
      const { error: convError } = await supabase
        .from('conversations')
        .insert({ match_id: data.id });

      if (convError) throw convError;

      // Create notification for the other user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          type: 'match_request',
          content: 'You have a new match request!',
          related_id: data.id
        });

      if (notifError) throw notifError;

      toast({
        title: "Match request sent",
        description: "Your match request has been sent successfully",
      });

      await fetchSuggestedMatches();
    } catch (error: any) {
      toast({
        title: "Error creating match",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const respondToMatch = async (matchId: string, response: 'accept' | 'reject') => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");

      // Get the match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Determine if user is user1 or user2
      const isUser1 = matchData.user1_id === user.id;
      const otherUserId = isUser1 ? matchData.user2_id : matchData.user1_id;

      // Update the appropriate user_status
      const updates: any = {};
      if (isUser1) {
        updates.user1_status = response;
      } else {
        updates.user2_status = response;
      }

      // If both users have accepted, update the overall status
      if (
        (isUser1 && response === 'accept' && matchData.user2_status === 'accept') ||
        (!isUser1 && response === 'accept' && matchData.user1_status === 'accept')
      ) {
        updates.status = 'accepted';
      } else if (response === 'reject') {
        updates.status = 'rejected';
      }

      // Update the match
      const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);

      if (error) throw error;

      // Create notification for the other user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          type: response === 'accept' ? 'match_accepted' : 'match_rejected',
          content: response === 'accept' 
            ? 'Your match request was accepted!' 
            : 'Your match request was declined.',
          related_id: matchId
        });

      if (notifError) throw notifError;

      toast({
        title: response === 'accept' ? "Match accepted" : "Match rejected",
        description: response === 'accept' 
          ? "You are now matched! You can start chatting." 
          : "Match request has been declined",
      });

      await fetchMatches();
    } catch (error: any) {
      toast({
        title: "Error responding to match",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    matches,
    suggestedMatches,
    loading,
    fetchMatches,
    fetchSuggestedMatches,
    createMatch,
    respondToMatch,
  };

  return <MatchingContext.Provider value={value}>{children}</MatchingContext.Provider>;
};

export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};
