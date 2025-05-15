import { useState, useCallback, useRef } from 'react';
import { db } from '@/integrations/supabase/enhanced-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MatchType, MatchStatus } from './types';
import { useMatchTransform } from './useMatchTransform';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/enhanced-client';

// Debounce helper function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const useMatchOperations = () => {
  const { user } = useAuth();
  const { transformMatchData } = useMatchTransform();
  const [matches, setMatches] = useState<MatchType[]>([]);
  const [possibleMatches, setPossibleMatches] = useState<MatchType[]>([]);
  const [myPendingMatches, setMyPendingMatches] = useState<MatchType[]>([]);
  const [theirPendingMatches, setTheirPendingMatches] = useState<MatchType[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function to create a placeholder profile for missing users
  const createPlaceholderProfile = (userId: string) => ({
    id: userId,
    first_name: 'Unknown',
    last_name: 'User',
    nickname: '',
    avatar_url: null,
    bio: null,
    student_type: null,
    major_id: null,
    nationality: null,
    is_verified: false,
    university_id: null,
    campus_id: null,
    year_of_study: null,
    cultural_insight: null,
    location: null,
    created_at: null,
    updated_at: null,
    interests: [],
    languages: []
  });

  // Helper function to wrap async operations with proper error handling
  const safeAsyncOperation = async <T,>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    errorMsg: string
  ): Promise<{ data: T | null; error: PostgrestError | null }> => {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      console.error(`${errorMsg}:`, error);
      return { data: null, error: error as PostgrestError };
    }
  };

  // Debounced fetch function to prevent too many requests
  const debouncedFetchMatches = useCallback(
    debounce(async () => {
      if (!user || isFetching) return;
      
      setIsFetching(true);
      setLoading(true);
      
      try {
        console.log('Starting to fetch matches for user:', user.id);
        
        // 1. First get the matches - use a simple query without joins
        const { data: matchesData, error: matchesError } = await db.matches()
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        if (matchesError) throw matchesError;
        if (!matchesData || matchesData.length === 0) {
          console.log('No matches found for user:', user.id);
          setMatches([]);
          setMyPendingMatches([]);
          setTheirPendingMatches([]);
          setPossibleMatches([]);
          return;
        }

        console.log('Fetched matches:', matchesData);

        // 2. Get ALL user IDs involved in these matches (not just the "other" users)
        const userIds = new Set<string>();
        matchesData.forEach(match => {
          userIds.add(match.user1_id);
          userIds.add(match.user2_id);
        });
        
        const userIdsArray = Array.from(userIds) as string[];
        console.log('Fetching profiles for users:', userIdsArray);

        // 3. Fetch ALL profiles
        const { data: profilesData, error: profilesError } = await db.profiles()
          .select('id, first_name, last_name, nickname, bio, nationality, year_of_study, university_id, campus_id, major_id, student_type, cultural_insight, location, avatar_url, is_verified, created_at, updated_at, interests, languages')
          .in('id', userIdsArray);

        if (profilesError) throw profilesError;
        console.log('Fetched profiles:', profilesData);

        // 4. Create a map for easy lookup
        const profileMap = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }

        console.log('Profile map created:', Object.keys(profileMap));

        // 5. Transform the data to include the other user's profile
        const transformedMatches = matchesData.map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const otherUserProfile = profileMap[otherUserId];

          // Log if a profile is missing
          if (!profileMap[match.user1_id]) {
            console.warn(`Missing profile for user1_id: ${match.user1_id}`);
          }
          if (!profileMap[match.user2_id]) {
            console.warn(`Missing profile for user2_id: ${match.user2_id}`);
          }

          // Skip matches where the other user's profile is missing
          if (!otherUserProfile) {
            console.warn(`Skipping match ${match.id} because profile for user ${otherUserId} is missing`);
            return null;
          }

          return {
            id: match.id,
            created_at: match.created_at,
            updated_at: match.updated_at,
            user1_id: match.user1_id,
            user2_id: match.user2_id,
            status: match.status as MatchStatus,
            user1_status: match.user1_status,
            user2_status: match.user2_status,
            otherUser: {
              ...otherUserProfile,
              id: otherUserId,
              first_name: otherUserProfile.first_name,
              last_name: otherUserProfile.last_name,
              nickname: otherUserProfile.nickname,
              avatar_url: otherUserProfile.avatar_url || '',
              university_id: otherUserProfile.university_id,
              campus_id: otherUserProfile.campus_id,
              major_id: otherUserProfile.major_id,
              bio: otherUserProfile.bio || '',
              nationality: otherUserProfile.nationality || '',
              year_of_study: otherUserProfile.year_of_study,
              student_type: otherUserProfile.student_type || '',
              cultural_insight: otherUserProfile.cultural_insight,
              location: otherUserProfile.location,
              is_verified: otherUserProfile.is_verified,
              created_at: otherUserProfile.created_at,
              updated_at: otherUserProfile.updated_at,
              interests: otherUserProfile.interests || [],
              languages: otherUserProfile.languages || [],
              common_interests: 0,
              common_languages: 0,
              match_score: 0
            }
          } as MatchType;
        }).filter(Boolean); // Remove null entries (matches with missing profiles)

        // Sort and categorize matches
        const acceptedMatches = transformedMatches.filter(m => m.status === 'accepted');
        const pendingMatches = transformedMatches.filter(m => m.status === 'pending');
        
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

        console.log('Categorized matches:', {
          accepted: acceptedMatches.length,
          myPending: myPending.length,
          theirPending: theirPending.length
        });

        setMatches(acceptedMatches);
        setMyPendingMatches(myPending);
        setTheirPendingMatches(theirPending);
        setPossibleMatches([]);
      } catch (error: any) {
        console.error('Error fetching matches:', error);
        toast({
          title: 'Error fetching matches',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    }, 500), // 500ms debounce
    [user, isFetching]
  );

  // Wrapper function that calls the debounced version
  const fetchMatches = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching matches for user:', user.id);
      
      // Fetch only accepted matches directly from the database
      const { data: acceptedMatchesData, error: acceptedMatchesError } = await db.matches()
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'accepted')  // Only get accepted matches
        .order('created_at', { ascending: false });
      
      if (acceptedMatchesError) {
        console.error('Error fetching accepted matches:', acceptedMatchesError);
        setError('Failed to fetch matches');
        setLoading(false);
        // Still fetch pending matches
        fetchPendingMatches();
        return;
      }
      
      if (!acceptedMatchesData || acceptedMatchesData.length === 0) {
        // No matches found
        setMatches([]);
        setLoading(false);
        // Still fetch pending matches
        fetchPendingMatches();
        return;
      }
      
      // Get all user IDs involved in matches
      const userIds = new Set<string>();
      acceptedMatchesData.forEach(match => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });
      
      // Fetch all profiles for these users
      const { data: profilesData, error: profilesError } = await db.profiles()
        .select('*')
        .in('id', Array.from(userIds));
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to fetch profiles');
        setLoading(false);
        return;
      }
      
      // Create profile lookup map
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Transform the matches with profile data
      const transformedMatches = acceptedMatchesData.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherProfile = profileMap.get(otherUserId) || createPlaceholderProfile(otherUserId);
        
        return {
          id: match.id,
          created_at: match.created_at,
          updated_at: match.updated_at,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          status: match.status as MatchStatus,
          user1_status: match.user1_status || 'accepted',
          user2_status: match.user2_status || 'accepted',
          otherUser: {
            id: otherUserId,
            first_name: otherProfile.first_name,
            last_name: otherProfile.last_name,
            nickname: otherProfile.nickname || '',
            avatar_url: otherProfile.avatar_url || '',
            university_id: otherProfile.university_id || null,
            campus_id: otherProfile.campus_id || null,
            major_id: otherProfile.major_id || null,
            bio: otherProfile.bio || '',
            nationality: otherProfile.nationality || '',
            year_of_study: otherProfile.year_of_study || null,
            student_type: otherProfile.student_type || '',
            cultural_insight: otherProfile.cultural_insight || null,
            location: otherProfile.location || null,
            is_verified: otherProfile.is_verified || false,
            created_at: otherProfile.created_at || null,
            updated_at: otherProfile.updated_at || null,
            interests: otherProfile.interests || [],
            languages: otherProfile.languages || [],
            common_interests: 0,
            common_languages: 0,
            match_score: 0.75 // Default score
          }
        } as MatchType;
      });
      
      setMatches(transformedMatches);
      
      // Also fetch pending matches
      fetchPendingMatches();
      
    } catch (error) {
      console.error('Error in fetchMatches:', error);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedMatches = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get a limited number of profiles that are not the current user
      const { data: profilesData, error: profilesError } = await db.profiles()
        .select('id, first_name, last_name, avatar_url, bio, student_type, major_id, nationality, is_verified')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log('No profiles found');
        setSuggestedMatches([]);
        setLoading(false);
        return;
      }

      console.log('Found profiles:', profilesData.length);

      // Get the current user's interests
      const { data: userInterests, error: interestsError } = await db.userInterests()
        .select('interest_id')
        .eq('user_id', user.id);

      if (interestsError) {
        console.error('Error fetching user interests:', interestsError);
      }

      // Get the current user's languages
      const { data: userLanguages, error: languagesError } = await db.userLanguages()
        .select('language_id')
        .eq('user_id', user.id);

      if (languagesError) {
        console.error('Error fetching user languages:', languagesError);
      }

      const userInterestIds = userInterests?.map(ui => ui.interest_id) || [];
      const userLanguageIds = userLanguages?.map(ul => ul.language_id) || [];

      // Process profiles and calculate match scores
      const suggestedMatchesWithScores = await Promise.all(
        profilesData.map(async (profile) => {
          // Get potential match's interests
          const { data: matchInterests } = await db.userInterests()
            .select('interest_id')
            .eq('user_id', profile.id);

          // Get potential match's languages
          const { data: matchLanguages } = await db.userLanguages()
            .select('language_id')
            .eq('user_id', profile.id);

          const matchInterestIds = matchInterests?.map(ui => ui.interest_id) || [];
          const matchLanguageIds = matchLanguages?.map(ul => ul.language_id) || [];

          // Calculate common interests and languages
          const commonInterests = userInterestIds.filter(id => matchInterestIds.includes(id)).length;
          const commonLanguages = userLanguageIds.filter(id => matchLanguageIds.includes(id)).length;

          // Calculate match score (0-100)
          const matchScore = Math.round(
            ((commonInterests + commonLanguages) / 4) * 100
          );

          return {
            ...profile,
            common_interests: commonInterests,
            common_languages: commonLanguages,
            match_score: matchScore
          };
        })
      );

      // Sort by match score in descending order
      const sortedMatches = suggestedMatchesWithScores.sort((a, b) => b.match_score - a.match_score);
      console.log('Sorted matches:', sortedMatches.length);
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
  }, [user]);

  const createMatch = async (matchUserId: string) => {
    if (!user) return;

    try {
      // Check if match already exists (any status)
      const { data: existingMatch } = await db.matches()
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${matchUserId}),and(user1_id.eq.${matchUserId},user2_id.eq.${user.id})`)
        .limit(1);

      if (existingMatch && existingMatch.length > 0) {
        const match = existingMatch[0];
        // If match is pending or accepted, do not allow duplicate
        if (["pending", "accepted"].includes(match.status)) {
          toast({
            title: 'Match already exists',
            description: 'You already have a match or pending request with this user',
            variant: 'destructive',
          });
          return;
        }
        // If match is rejected or unmatched, update it to pending and reset statuses
        if (["rejected", "unmatched"].includes(match.status)) {
          const { error: updateError } = await db.matches().update({
            status: 'pending',
            user1_status: user.id === match.user1_id ? 'accepted' : 'pending',
            user2_status: user.id === match.user2_id ? 'accepted' : 'pending',
            updated_at: new Date().toISOString(),
          }).eq('id', match.id);
          if (updateError) throw updateError;
          toast({
            title: 'Match request sent',
            description: 'You have re-sent a match request to this user',
          });
          await fetchMatches();
          return;
        }
      }

      // Create new match
      const { data: newMatch, error } = await db.matches().insert({
        user1_id: user.id,
        user2_id: matchUserId,
        status: 'pending',
        user1_status: 'accepted',
        user2_status: 'pending'
      }).select().single();

      if (error) throw error;

      // Create notification for the other user
      await db.notifications().insert({
        user_id: matchUserId,
        type: 'match_request',
        content: 'You have a new match request',
        related_id: newMatch.id,
        is_read: false
      });

      toast({
        title: 'Match created',
        description: 'You have successfully sent a match request',
      });
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
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      
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
        
        // Create notification for both users when match is accepted
        await db.notifications().insert([
          {
            user_id: match.user1_id,
            type: 'match_accepted',
            content: 'Your match request has been accepted',
            related_id: matchId,
            is_read: false
          },
          {
            user_id: match.user2_id,
            type: 'match_accepted',
            content: 'Your match request has been accepted',
            related_id: matchId,
            is_read: false
          }
        ]);
      }

      // If one user has rejected, update the match status
      if (status === 'rejected') {
        updates = { ...updates, status: 'rejected' };
        
        // Create notification for the other user when match is rejected
        await db.notifications().insert({
          user_id: otherUserId,
          type: 'match_rejected',
          content: 'Your match request has been declined',
          related_id: matchId,
          is_read: false
        });
      }

      const { error: updateError } = await db.matches()
        .update(updates)
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Refresh matches for both users
      await fetchMatches();
    } catch (error: any) {
      console.error('Error updating match status:', error);
      throw error;
    }
  };

  // Function to fetch match state like pending matches
  const fetchPendingMatches = async () => {
    if (!user || isFetching) return;
    
    try {
      console.log('Fetching match state for user:', user.id);
      
      // Fetch pending matches
      const { data: pendingMatchesData, error: pendingError } = await db.matches()
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (pendingError) throw pendingError;
      
      // Get user IDs from pending matches
      const userIds = new Set<string>();
      pendingMatchesData?.forEach(match => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await db.profiles()
        .select('id, first_name, last_name, nickname, bio, nationality, student_type, avatar_url, interests, languages')
        .in('id', Array.from(userIds));
      
      if (profilesError) throw profilesError;
      
      // Create a map for easy profile lookup
      const profileMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);
      
      // Transform pending matches to include otherUser
      const transformedPendingMatches = (pendingMatchesData || []).map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUserProfile = profileMap.get(otherUserId) || createPlaceholderProfile(otherUserId);
        
        return {
          ...match,
          status: match.status as MatchStatus,
          otherUser: {
            ...otherUserProfile,
            id: otherUserId,
            first_name: otherUserProfile.first_name,
            last_name: otherUserProfile.last_name,
            nickname: otherUserProfile.nickname || '',
            avatar_url: otherUserProfile.avatar_url || '',
            bio: otherUserProfile.bio || '',
            nationality: otherUserProfile.nationality || '',
            student_type: otherUserProfile.student_type || '',
            interests: otherUserProfile.interests || [],
            languages: otherUserProfile.languages || [],
            match_score: 0.75
          }
        } as MatchType;
      });
      
      // Filter my pending matches
      const myPendingMatchesFiltered = transformedPendingMatches.filter(m => 
        (m.user1_id === user.id && m.user1_status === 'accepted') ||
        (m.user2_id === user.id && m.user2_status === 'accepted')
      );
      
      // Filter their pending matches
      const theirPendingMatchesFiltered = transformedPendingMatches.filter(m => 
        (m.user1_id === user.id && m.user1_status === 'pending') ||
        (m.user2_id === user.id && m.user2_status === 'pending')
      );
      
      setMyPendingMatches(myPendingMatchesFiltered);
      setTheirPendingMatches(theirPendingMatchesFiltered);
      setPossibleMatches([]);
    } catch (err) {
      console.error('Error fetching match state:', err);
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
