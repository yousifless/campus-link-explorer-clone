
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MatchType, MatchStatus } from './types';

export const useMatchOperations = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [possibleMatches, setPossibleMatches] = useState<MatchType[]>([]);
  const [myPendingMatches, setMyPendingMatches] = useState<MatchType[]>([]);
  const [theirPendingMatches, setTheirPendingMatches] = useState<MatchType[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all matches where the user is either user1 or user2
      // Use string interpolation for the OR condition to avoid the foreign key error
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      // Process the matches to categorize them
      const matchesWithOtherUser = await Promise.all(
        (data || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          // Get the other user's profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();
            
          return {
            ...match,
            otherUser: profileData,
          } as MatchType;
        })
      );

      // Sort and categorize matches
      const acceptedMatches = matchesWithOtherUser.filter(m => m.status === 'accepted');
      const pendingMatches = matchesWithOtherUser.filter(m => m.status === 'pending');
      
      // Pending matches that I initiated
      const myPending = pendingMatches.filter(m => 
        (m.user1_id === user.id && m.user1_status === 'accepted') || 
        (m.user2_id === user.id && m.user2_status === 'accepted')
      );
      
      // Pending matches that others initiated
      const theirPending = pendingMatches.filter(m => 
        (m.user1_id === user.id && m.user1_status === 'pending') || 
        (m.user2_id === user.id && m.user2_status === 'pending')
      );

      setMatches(matchesWithOtherUser);
      setPossibleMatches(acceptedMatches);
      setMyPendingMatches(myPending);
      setTheirPendingMatches(theirPending);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      toast({
        title: 'Error fetching matches',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get a limited number of profiles that are not the current user
      // This is a simplified suggestion algorithm without creating test users
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_interests!inner(interest_id, interests(*)), user_languages!inner(language_id, languages(*))')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get the current user's interests and languages
      const { data: userInterests } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', user.id);

      const { data: userLanguages } = await supabase
        .from('user_languages')
        .select('language_id')
        .eq('user_id', user.id);

      // Process the suggested matches with genuine match scores
      const suggestedData = data.map(profile => {
        // Calculate common interests
        const profileInterests = profile.user_interests?.map(ui => ui.interest_id) || [];
        const userInterestIds = userInterests?.map(ui => ui.interest_id) || [];
        const commonInterests = profileInterests.filter(id => 
          userInterestIds.includes(id)
        ).length;

        // Calculate common languages
        const profileLanguages = profile.user_languages?.map(ul => ul.language_id) || [];
        const userLanguageIds = userLanguages?.map(ul => ul.language_id) || [];
        const commonLanguages = profileLanguages.filter(id => 
          userLanguageIds.includes(id)
        ).length;

        // Calculate match score based on common interests and languages
        const matchScore = (commonInterests * 10) + (commonLanguages * 15);

        return {
          ...profile,
          common_interests: commonInterests,
          common_languages: commonLanguages,
          match_score: matchScore
        };
      }).sort((a, b) => b.match_score - a.match_score); // Sort by match score

      setSuggestedMatches(suggestedData);
    } catch (error: any) {
      console.error('Error fetching suggested matches:', error);
      toast({
        title: 'Error fetching suggested matches',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (matchUserId: string) => {
    if (!user) return;

    try {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${matchUserId}),and(user1_id.eq.${matchUserId},user2_id.eq.${user.id})`)
        .limit(1);

      if (existingMatch && existingMatch.length > 0) {
        toast({
          title: 'Match already exists',
          description: 'You already have a match with this user',
          variant: 'destructive',
        });
        return;
      }

      // Create new match with better error handling
      const { error } = await supabase.from('matches').insert({
        user1_id: user.id,
        user2_id: matchUserId,
        status: 'pending',
        user1_status: 'accepted',
        user2_status: 'pending',
        initiator_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Match created',
        description: 'You have successfully sent a match request',
      });
      
      // Refresh matches
      await fetchMatches();
    } catch (error: any) {
      console.error('Error creating match:', error);
      toast({
        title: 'Error creating match',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const acceptMatch = async (matchId: string) => {
    if (!user) return;

    try {
      await updateMatchStatus(matchId, 'accepted');

      toast({
        title: 'Match accepted',
        description: 'You have successfully accepted the match',
      });
      
      // Refresh matches
      await fetchMatches();
    } catch (error: any) {
      toast({
        title: 'Error accepting match',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectMatch = async (matchId: string) => {
    if (!user) return;

    try {
      await updateMatchStatus(matchId, 'rejected');

      toast({
        title: 'Match rejected',
        description: 'You have successfully rejected the match',
      });
      
      // Refresh matches
      await fetchMatches();
    } catch (error: any) {
      toast({
        title: 'Error rejecting match',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateMatchStatus = async (matchId: string, status: MatchStatus) => {
    if (!user) return;

    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      let updates = {};
      
      if (match.user1_id === user.id) {
        updates = { user1_status: status };
      } else if (match.user2_id === user.id) {
        updates = { user2_status: status };
      }

      // If both users have accepted, update the match status
      if (
        (match.user1_id === user.id && status === 'accepted' && match.user2_status === 'accepted') ||
        (match.user2_id === user.id && status === 'accepted' && match.user1_status === 'accepted')
      ) {
        updates = { ...updates, status: 'accepted' };
      }

      // If one user has rejected, update the match status
      if (status === 'rejected') {
        updates = { ...updates, status: 'rejected' };
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Error updating match status:', error);
      throw error;
    }
  };

  return { 
    matches, 
    possibleMatches, 
    myPendingMatches, 
    theirPendingMatches, 
    suggestedMatches, 
    loading, 
    fetchMatches, 
    fetchSuggestedMatches, 
    createMatch, 
    acceptMatch, 
    rejectMatch, 
    updateMatchStatus 
  };
};
