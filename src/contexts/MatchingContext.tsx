import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { MatchType, SuggestedMatchType } from '@/types/database';

type MatchingContextType = {
  matches: MatchType[];
  suggestedMatches: SuggestedMatchType[];
  loading: boolean;
  fetchMatches: () => Promise<void>;
  fetchSuggestedMatches: () => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  createMatch: (userId: string) => Promise<void>;
};

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedMatchType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data: rawMatches, error } = await supabase
        .from('matches')
        .select(`
          *,
          profiles_user1:user1_id(
            id,
            first_name,
            last_name,
            avatar_url,
            university,
            student_type,
            major,
            bio
          ),
          profiles_user2:user2_id(
            id,
            first_name,
            last_name,
            avatar_url,
            university,
            student_type,
            major,
            bio
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const userMatches = rawMatches.map((match: any) => {
        const isUser1 = match.user1_id === user?.id;
        const otherUserId = isUser1 ? match.user2_id : match.user1_id;
        
        const otherUserProfile = isUser1 
          ? (match.profiles_user2 || {}) 
          : (match.profiles_user1 || {});

        return {
          id: match.id,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          status: match.status,
          user1_status: match.user1_status,
          user2_status: match.user2_status,
          created_at: match.created_at,
          updated_at: match.updated_at,
          otherUser: {
            id: otherUserId,
            first_name: otherUserProfile.first_name || '',
            last_name: otherUserProfile.last_name || '',
            avatar_url: otherUserProfile.avatar_url || '',
            university: otherUserProfile.university || null,
            student_type: otherUserProfile.student_type || null,
            major: otherUserProfile.major || null,
            bio: otherUserProfile.bio || null,
            common_interests: 0,
            common_languages: 0,
            match_score: 0
          },
        };
      });

      setMatches(userMatches);
    } catch (error: any) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedMatches = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase.rpc('get_suggested_matches', {
        user_id: user.id
      });

      if (error) throw error;

      setSuggestedMatches(data || []);
    } catch (error: any) {
      console.error("Error fetching suggested matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (userId: string) => {
    try {
      setLoading(true);
      if (!user) return;

      const { error } = await supabase
        .from('matches')
        .insert({
          user1_id: user.id,
          user2_id: userId,
          status: 'pending',
          user1_status: 'accepted',
          user2_status: 'pending'
        });

      if (error) throw error;

      await fetchMatches();
    } catch (error: any) {
      console.error("Error creating match:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptMatch = async (matchId: string) => {
    try {
      setLoading(true);
      if (!user) return;

      setMatches(matches.map(match =>
        match.id === matchId ? { ...match, status: 'accepted' } : match
      ));

      const { error } = await supabase
        .from('matches')
        .update({ status: 'accepted' })
        .eq('id', matchId);

      if (error) {
        console.error("Error accepting match:", error);
        setMatches(matches.map(match =>
          match.id === matchId ? { ...match, status: 'pending' } : match
        ));
      }
    } catch (error: any) {
      console.error("Error accepting match:", error);
    } finally {
      setLoading(false);
    }
  };

  const rejectMatch = async (matchId: string) => {
    try {
      setLoading(true);
      if (!user) return;

      setMatches(matches.map(match =>
        match.id === matchId ? { ...match, status: 'rejected' } : match
      ));

      const { error } = await supabase
        .from('matches')
        .update({ status: 'rejected' })
        .eq('id', matchId);

      if (error) {
        console.error("Error rejecting match:", error);
        setMatches(matches.map(match =>
          match.id === matchId ? { ...match, status: 'pending' } : match
        ));
      }
    } catch (error: any) {
      console.error("Error rejecting match:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchSuggestedMatches();
    }
  }, [user]);

  const value = {
    matches,
    suggestedMatches,
    loading,
    fetchMatches,
    fetchSuggestedMatches,
    acceptMatch,
    rejectMatch,
    createMatch,
  };

  return (
    <MatchingContext.Provider value={value}>
      {children}
    </MatchingContext.Provider>
  );
};

export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};
