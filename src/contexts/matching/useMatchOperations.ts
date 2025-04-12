
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MatchType, SuggestedMatchType } from '@/types/database';
import { useMatchTransform } from './useMatchTransform';

export const useMatchOperations = (userId: string | undefined) => {
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedMatchType[]>([]);
  const [loading, setLoading] = useState(true);
  const { transformMatchData } = useMatchTransform();

  const fetchMatches = async () => {
    try {
      setLoading(true);
      if (!userId) return;

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
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) throw error;

      const userMatches = transformMatchData(rawMatches, userId);
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
      if (!userId) return;

      const { data, error } = await supabase.rpc('get_suggested_matches', {
        user_id: userId
      });

      if (error) throw error;

      setSuggestedMatches(data || []);
    } catch (error: any) {
      console.error("Error fetching suggested matches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fixed type for matchUserId parameter to make it compatible with SuggestedMatchType.id
  const createMatch = async (matchUserId: string) => {
    try {
      setLoading(true);
      if (!userId) return;

      const { error } = await supabase
        .from('matches')
        .insert({
          user1_id: userId,
          user2_id: matchUserId,
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
      if (!userId) return;

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
      if (!userId) return;

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

  return {
    matches,
    suggestedMatches,
    loading,
    fetchMatches,
    fetchSuggestedMatches,
    acceptMatch,
    rejectMatch,
    createMatch,
  };
};
