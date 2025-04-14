import { useState, useEffect } from 'react';
import { db } from '@/integrations/supabase/enhanced-client';
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
      const { data, error } = await db.matches()
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      // Process the matches to categorize them
      const matchesWithOtherUser = await Promise.all(
        (data || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          // Get the other user's profile
          const { data: profileData } = await db.profiles()
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
      const { data: profilesData, error: profilesError } = await db.profiles()
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (profilesError) throw profilesError;

      // Get the current user's interests - FIX: Properly handle potential errors
      const { data: userInterestsData, error: interestsError } = await db.userInterests()
        .select('interest_id')
        .eq('user_id', user.id);

      // If there's an error, log it but continue with empty interests
      let userInterestIds: string[] = [];
      if (interestsError) {
        console.error('Error fetching user interests:', interestsError);
      } else {
        userInterestIds = (userInterestsData || []).map(ui => ui.interest_id);
      }

      // Get the current user's languages - FIX: Properly handle potential errors
      const { data: userLanguagesData, error: languagesError } = await db.userLanguages()
        .select('language_id')
        .eq('user_id', user.id);

      // If there's an error, log it but continue with empty languages
      let userLanguageIds: string[] = [];
      if (languagesError) {
        console.error('Error fetching user languages:', languagesError);
      } else {
        userLanguageIds = (userLanguagesData || []).map(ul => ul.language_id);
      }

      // Process profiles with their interests and languages
      const suggestedMatchesWithScores = await Promise.all((profilesData || []).map(async (profile) => {
        // Get this profile's interests
        const { data: profileInterestsData } = await db.userInterests()
          .select('interest_id')
          .eq('user_id', profile.id);
        
        const profileInterestIds = (profileInterestsData || []).map(pi => pi.interest_id);
        
        // Get this profile's languages
        const { data: profileLanguagesData } = await db.userLanguages()
          .select('language_id')
          .eq('user_id', profile.id);
          
        const profileLanguageIds = (profileLanguagesData || []).map(pl => pl.language_id);
        
        // Calculate common interests and languages
        const commonInterests = profileInterestIds.filter(id => userInterestIds.includes(id)).length;
        const commonLanguages = profileLanguageIds.filter(id => userLanguageIds.includes(id)).length;
        
        // Calculate match score
        const matchScore = (commonInterests * 10) + (commonLanguages * 15);
        
        return {
          ...profile,
          common_interests: commonInterests,
          common_languages: commonLanguages,
          match_score: matchScore
        };
      }));

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
  };

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
