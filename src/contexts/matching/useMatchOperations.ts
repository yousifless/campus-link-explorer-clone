
import { useState, useCallback } from 'react';
import { db } from '@/integrations/supabase/enhanced-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MatchType, MatchStatus } from './types';
import { useMatchTransform } from './useMatchTransform';
import { PostgrestError } from '@supabase/supabase-js';

export const useMatchOperations = () => {
  const { user } = useAuth();
  const { transformMatchData } = useMatchTransform();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [possibleMatches, setPossibleMatches] = useState<MatchType[]>([]);
  const [myPendingMatches, setMyPendingMatches] = useState<MatchType[]>([]);
  const [theirPendingMatches, setTheirPendingMatches] = useState<MatchType[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Helper function to wrap async operations with proper error handling
  const safeAsyncOperation = async <T,>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>, 
    errorMsg: string
  ): Promise<{ data: T | null; error: PostgrestError | null }> => {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`${errorMsg}:`, error);
      return { data: null, error: error as PostgrestError };
    }
  };

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all matches where the user is either user1 or user2
      const { data, error } = await db.matches()
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      if (!data || data.length === 0) {
        setMatches([]);
        setPossibleMatches([]);
        setMyPendingMatches([]);
        setTheirPendingMatches([]);
        setLoading(false);
        return;
      }

      // Process the matches to categorize them
      const matchesWithOtherUser = await Promise.all(
        data.map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          // Get the other user's profile with proper error handling
          const profileResult = await safeAsyncOperation(
            () => db.profiles().select('*').eq('id', otherUserId).single(),
            `Error fetching profile for user ${otherUserId}`
          );
          
          const profileData = profileResult?.data || null;
            
          return {
            ...match,
            otherUser: profileData || {
              id: otherUserId,
              first_name: 'Unknown',
              last_name: 'User',
            },
          } as MatchType;
        })
      );

      // Filter out invalid matches (where otherUser is null)
      const validMatches = matchesWithOtherUser.filter(match => match.otherUser);

      // Sort and categorize matches
      const acceptedMatches = validMatches.filter(m => m.status === 'accepted');
      const pendingMatches = validMatches.filter(m => m.status === 'pending');
      
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

      setMatches(validMatches);
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
  }, [user]);

  const fetchSuggestedMatches = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get a limited number of profiles that are not the current user
      const { data: profilesData, error: profilesError } = await db.profiles()
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(5); // Reduced to 5 from 10 to limit resource usage

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setSuggestedMatches([]);
        setLoading(false);
        return;
      }

      // Get the current user's interests with proper error handling
      const interestsResult = await safeAsyncOperation(
        () => db.userInterests().select('interest_id').eq('user_id', user.id),
        'Error fetching user interests'
      );

      // Safely handle the possibility that interestsResult is null
      let userInterestIds: string[] = [];
      if (interestsResult?.data) {
        userInterestIds = interestsResult.data.map(ui => ui.interest_id);
      }

      // Get the current user's languages with proper error handling
      const languagesResult = await safeAsyncOperation(
        () => db.userLanguages().select('language_id').eq('user_id', user.id),
        'Error fetching user languages'
      );

      // Safely handle the possibility that languagesResult is null
      let userLanguageIds: string[] = [];
      if (languagesResult?.data) {
        userLanguageIds = languagesResult.data.map(ul => ul.language_id);
      }

      // Process profiles sequentially to reduce concurrent requests
      const suggestedMatchesWithScores = [];
      for (const profile of profilesData) {
        // Skip processing if too many requests are pending
        if (loading === false) {
          break;
        }
        
        // Get this profile's interests with proper error handling
        const profileInterestsResult = await safeAsyncOperation(
          () => db.userInterests().select('interest_id').eq('user_id', profile.id),
          `Error fetching interests for user ${profile.id}`
        );
        
        const profileInterestIds = profileInterestsResult?.data 
          ? profileInterestsResult.data.map(pi => pi.interest_id) 
          : [];
        
        // Get this profile's languages with proper error handling
        const profileLanguagesResult = await safeAsyncOperation(
          () => db.userLanguages().select('language_id').eq('user_id', profile.id),
          `Error fetching languages for user ${profile.id}`
        );
          
        const profileLanguageIds = profileLanguagesResult?.data 
          ? profileLanguagesResult.data.map(pl => pl.language_id) 
          : [];
        
        // Calculate common interests and languages
        const commonInterests = profileInterestIds.filter(id => userInterestIds.includes(id)).length;
        const commonLanguages = profileLanguageIds.filter(id => userLanguageIds.includes(id)).length;
        
        // Calculate match score
        const matchScore = (commonInterests * 10) + (commonLanguages * 15);
        
        suggestedMatchesWithScores.push({
          ...profile,
          common_interests: commonInterests,
          common_languages: commonLanguages,
          match_score: matchScore
        });
      }

      // Sort by match score
      const sortedMatches = suggestedMatchesWithScores.sort((a, b) => b.match_score - a.match_score);
      
      setSuggestedMatches(sortedMatches);
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
  }, [user, loading]);

  const createMatch = async (matchUserId: string) => {
    if (!user) return;

    try {
      // Check if match already exists
      const { data: existingMatch } = await db.matches()
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
      const { error } = await db.matches().insert({
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
      const { data: match, error: matchError } = await db.matches()
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

      const { error: updateError } = await db.matches()
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
