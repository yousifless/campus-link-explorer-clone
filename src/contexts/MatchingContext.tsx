
import React, { createContext, useContext, useState } from 'react';
import { supabase, db } from '@/integrations/supabase/enhanced-client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { MatchType, SuggestedMatchType } from '@/types/database';

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

      // Get matches where user is user1
      const { data: user1Matches, error: error1 } = await db.matches()
        .select(`
          id, user1_id, user2_id, status, user1_status, user2_status, created_at, updated_at,
          profiles!matches_user2_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user1_id', user.id);

      if (error1) throw error1;

      // Get matches where user is user2
      const { data: user2Matches, error: error2 } = await db.matches()
        .select(`
          id, user1_id, user2_id, status, user1_status, user2_status, created_at, updated_at,
          profiles!matches_user1_id_fkey(
            id, first_name, last_name, avatar_url
          )
        `)
        .eq('user2_id', user.id);

      if (error2) throw error2;

      // Process and combine matches
      const processedUser1Matches = user1Matches?.map((match) => ({
        ...match,
        otherUser: {
          id: match.profiles.id,
          first_name: match.profiles.first_name || '',
          last_name: match.profiles.last_name || '',
          avatar_url: match.profiles.avatar_url,
          university: null, // We can fetch additional data if needed
          student_type: null,
          major: null,
          bio: null,
          common_interests: 0,
          common_languages: 0,
          match_score: 0
        }
      })) || [];

      const processedUser2Matches = user2Matches?.map((match) => ({
        ...match,
        otherUser: {
          id: match.profiles.id,
          first_name: match.profiles.first_name || '',
          last_name: match.profiles.last_name || '',
          avatar_url: match.profiles.avatar_url,
          university: null,
          student_type: null,
          major: null,
          bio: null,
          common_interests: 0,
          common_languages: 0,
          match_score: 0
        }
      })) || [];

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
      const processedMatches = data?.map((match: any) => ({
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
      })) || [];

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
      const { data, error } = await db.matches()
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
      const { error: convError } = await db.conversations()
        .insert({ 
          match_id: data!.id 
        });

      if (convError) throw convError;

      // Create notification for the other user
      const { error: notifError } = await db.notifications()
        .insert({
          user_id: otherUserId,
          type: 'match_request',
          content: 'You have a new match request!',
          related_id: data!.id,
          is_read: false
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
      const { data: matchData, error: matchError } = await db.matches()
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Determine if user is user1 or user2
      const isUser1 = matchData!.user1_id === user.id;
      const otherUserId = isUser1 ? matchData!.user2_id : matchData!.user1_id;

      // Update the appropriate user_status
      const updates: any = {};
      if (isUser1) {
        updates.user1_status = response;
      } else {
        updates.user2_status = response;
      }

      // If both users have accepted, update the overall status
      if (
        (isUser1 && response === 'accept' && matchData!.user2_status === 'accept') ||
        (!isUser1 && response === 'accept' && matchData!.user1_status === 'accept')
      ) {
        updates.status = 'accepted';
      } else if (response === 'reject') {
        updates.status = 'rejected';
      }

      // Update the match
      const { error } = await db.matches()
        .update(updates)
        .eq('id', matchId);

      if (error) throw error;

      // Create notification for the other user
      const { error: notifError } = await db.notifications()
        .insert({
          user_id: otherUserId,
          type: response === 'accept' ? 'match_accepted' : 'match_rejected',
          content: response === 'accept' 
            ? 'Your match request was accepted!' 
            : 'Your match request was declined.',
          related_id: matchId,
          is_read: false
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

export type { MatchType, SuggestedMatchType };
