import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { MatchingContextType } from './types';
import { useMatchOperations } from './useMatchOperations';

interface MatchWeights {
  location: number;
  interests: number;
  languages: number;
  goals: number;
  availability: number;
  personality: number;
  network: number;
}

interface MatchingContextProps {
  suggestedMatches: any[] | null;
  fetchSuggestedMatches: () => Promise<void>;
  matchPreferences: MatchWeights | null;
  updateMatchPreference: (factor: keyof MatchWeights, value: number) => Promise<void>;
  resetMatchPreferences: () => Promise<void>;
  acceptMatch: (userId: string) => Promise<void>;
  rejectMatch: (userId: string) => Promise<void>;
  loading: boolean;
  matches: any[]; 
  possibleMatches: any[];
  myPendingMatches: any[];
  theirPendingMatches: any[];
  fetchMatches: () => Promise<void>;
  updateMatchStatus: (matchId: string, status: any) => Promise<void>;
  createMatch: (userId: string) => Promise<void>;
}

const MatchingContext = createContext<MatchingContextProps>({
  suggestedMatches: null,
  fetchSuggestedMatches: async () => {},
  matchPreferences: null,
  updateMatchPreference: async () => {},
  resetMatchPreferences: async () => {},
  acceptMatch: async () => {},
  rejectMatch: async () => {},
  loading: false,
  matches: [],
  possibleMatches: [],
  myPendingMatches: [],
  theirPendingMatches: [],
  fetchMatches: async () => {},
  updateMatchStatus: async () => {},
  createMatch: async () => {},
});

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { 
    matches,
    possibleMatches,
    myPendingMatches,
    theirPendingMatches,
    suggestedMatches: serverSuggestedMatches, 
    loading: serverLoading, 
    fetchMatches, 
    fetchSuggestedMatches: serverFetchSuggestedMatches, 
    acceptMatch: serverAcceptMatch, 
    rejectMatch: serverRejectMatch,
    updateMatchStatus,
    createMatch,
  } = useMatchOperations();
  
  const [isFetching, setIsFetching] = useState(false);
  const lastFetchTimeRef = useRef(0);
  const fetchCooldownMs = 5000; // 5 seconds cooldown
  const [suggestedMatches, setSuggestedMatches] = useState<any[] | null>(null);
  const [matchPreferences, setMatchPreferences] = useState<MatchWeights | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Default preferences
  const defaultPreferences: MatchWeights = {
    location: 0.15,
    interests: 0.25,
    languages: 0.15,
    goals: 0.15,
    availability: 0.1,
    personality: 0.1,
    network: 0.1,
  };

  // Load user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_match_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching match preferences:', error);
          return;
        }

        if (data) {
          setMatchPreferences({
            location: data.location,
            interests: data.interests,
            languages: data.languages,
            goals: data.goals,
            availability: data.availability,
            personality: data.personality,
            network: data.network,
          });
        } else {
          // If no preferences exist, use defaults
          setMatchPreferences(defaultPreferences);
          
          // Create default preferences
          await savePreferences(defaultPreferences);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Error in fetchUserPreferences:', error);
      }
    };

    fetchUserPreferences();
  }, [user]);

  // Save all preferences using direct upsert
  const savePreferences = async (preferences: MatchWeights) => {
    if (!user) return;

    try {
      // Normalize the preferences to ensure they sum to exactly 1.0
      const totalWeight = Object.values(preferences).reduce((sum, weight) => sum + weight, 0);
      const normalizedPreferences = Object.entries(preferences).reduce((acc, [key, value]) => {
        acc[key as keyof MatchWeights] = Number((value / totalWeight).toFixed(6));
        return acc;
      }, {} as MatchWeights);
      
      // Ensure the sum is exactly 1.0 by adjusting the largest weight if needed
      const normalizedSum = Object.values(normalizedPreferences).reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(normalizedSum - 1) > 0.00001) {
        const diff = 1 - normalizedSum;
        // Find the largest weight to adjust
        const largestKey = Object.entries(normalizedPreferences)
          .sort(([, a], [, b]) => b - a)[0][0] as keyof MatchWeights;
        normalizedPreferences[largestKey] += diff;
      }

      // First check if preferences already exist
      const { data: existingPrefs } = await supabase
        .from('user_match_preferences')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingPrefs) {
        // If preferences exist, use update
        const { error } = await supabase
          .from('user_match_preferences')
          .update({
            location: normalizedPreferences.location,
            interests: normalizedPreferences.interests,
            languages: normalizedPreferences.languages,
            goals: normalizedPreferences.goals,
            availability: normalizedPreferences.availability,
            personality: normalizedPreferences.personality,
            network: normalizedPreferences.network,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // If no preferences exist, insert new ones
        const { error } = await supabase
          .from('user_match_preferences')
          .insert({
            user_id: user.id,
            location: normalizedPreferences.location,
            interests: normalizedPreferences.interests,
            languages: normalizedPreferences.languages,
            goals: normalizedPreferences.goals,
            availability: normalizedPreferences.availability,
            personality: normalizedPreferences.personality,
            network: normalizedPreferences.network,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
      throw error;
    }
  };

  // Update a single preference factor
  const updateMatchPreference = async (factor: keyof MatchWeights, value: number) => {
    if (!matchPreferences || !user) return;

    const updatedPreferences = {
      ...matchPreferences,
      [factor]: value,
    };

    setMatchPreferences(updatedPreferences);

    try {
      await savePreferences(updatedPreferences);
    } catch (error) {
      console.error(`Error updating ${factor} preference:`, error);
    }
  };

  // Reset preferences to default
  const resetMatchPreferences = async () => {
    if (!user) return;
    
    setMatchPreferences(defaultPreferences);
    
    try {
      await savePreferences(defaultPreferences);
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  };

  // Function to safely fetch matches with cooldown
  const safeFetchMatches = (): Promise<void> => {
    return new Promise((resolve) => {
      const now = Date.now();
      
      // If we're already fetching, skip
      if (isFetching) {
        console.log('Fetch already in progress, skipping...');
        resolve();
        return;
      }
      
      // If we're in cooldown period, skip
      if (now - lastFetchTimeRef.current < fetchCooldownMs) {
        console.log('Fetch cooldown active, skipping...');
        resolve();
        return;
      }
      
      // Start fetching
      setIsFetching(true);
      lastFetchTimeRef.current = now;
      
      fetchMatches()
        .then(() => {
          setIsFetching(false);
          resolve();
        })
        .catch((error) => {
          console.error('Error fetching matches:', error);
          setIsFetching(false);
          resolve();
        });
    });
  };

  useEffect(() => {
    if (user) {
      safeFetchMatches();
      // Only fetch suggested matches if the function exists
      if (serverFetchSuggestedMatches) {
        serverFetchSuggestedMatches();
      }
    }
  }, [user, fetchMatches, serverFetchSuggestedMatches]);

  // Listen for refresh-matches event with cooldown
  useEffect(() => {
    const handleRefreshMatches = () => {
      console.log('Refresh matches event received');
      safeFetchMatches();
    };

    window.addEventListener('refresh-matches', handleRefreshMatches);
    
    return () => {
      window.removeEventListener('refresh-matches', handleRefreshMatches);
    };
  }, [fetchMatches]);

  // Fetch suggested matches
  const fetchSuggestedMatches = async () => {
    if (!user || !profile || isFetching) {
      if (isFetching) console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      setLoading(true);
      setIsFetching(true);
      
      // Set timeout to prevent repeated calls
      const fetchTimeout = setTimeout(() => {
        setIsFetching(false);
      }, 10000); // 10s timeout safety

      // Get existing matches to exclude
      const { data: existingMatches, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, status')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesError) throw matchesError;
      
      // Create a set of user IDs that are already matched or rejected
      const matchedUserIds = new Set<string>();
      existingMatches?.forEach(match => {
        // Only exclude if status is not 'unmatched' - we want to show unmatched profiles again
        if (match.status !== 'unmatched') {
          if (match.user1_id === user.id) {
            matchedUserIds.add(match.user2_id);
          } else if (match.user2_id === user.id) {
            matchedUserIds.add(match.user1_id);
          }
        }
      });

      // Get profiles that are not the current user and not already matched/rejected
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          nickname,
          interests,
          languages,
          bio,
          student_type,
          university_id,
          major_id,
          year_of_study,
          avatar_url
        `)
        .neq('id', user.id)
        .limit(50);

      if (error) throw error;

      console.log('Found profiles:', profiles.length);

      // Filter out users that are already matched/rejected
      const filteredProfiles = profiles.filter(profile => !matchedUserIds.has(profile.id));
      
      if (filteredProfiles.length === 0) {
        setSuggestedMatches([]);
        setLoading(false);
        setIsFetching(false);
        clearTimeout(fetchTimeout);
        return;
      }
      
      // Calculate match scores (actual implementation would use matchPreferences)
      const matchesWithScores = filteredProfiles.map((potentialMatch: any) => {
        // In a real implementation, this would calculate based on preferences
        // For now we'll use a more realistic distribution of scores
        const baseScore = 0.4 + Math.random() * 0.4; // Score between 40% and 80%
        
        // Add a bonus for shared interests (if data is available)
        let interestBonus = 0;
        if (potentialMatch.interests && profile.interests) {
          const userInterests = new Set(profile.interests);
          const matchInterests = new Set(potentialMatch.interests);
          const intersection = new Set([...userInterests].filter(i => matchInterests.has(i)));
          interestBonus = intersection.size * 0.02; // 2% per shared interest
        }
        
        return {
          ...potentialMatch,
          match_score: Math.min(0.95, baseScore + interestBonus), // Cap at 95%
        };
      });

      // Sort by match score
      const sortedMatches = matchesWithScores.sort((a, b) => b.match_score - a.match_score);
      
      setSuggestedMatches(sortedMatches);
      clearTimeout(fetchTimeout);
    } catch (error) {
      console.error('Error fetching suggested matches:', error);
      toast.error('Failed to load potential matches');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Accept a match (send a match request)
  const acceptMatch = async (userId: string) => {
    if (!user) return;
    try {
      // Use the improved createMatch logic from useMatchOperations
      await createMatch(userId);
      // Remove from suggested matches
      setSuggestedMatches((prev) => prev ? prev.filter(match => match.id !== userId) : prev);
    } catch (error) {
      console.error('Error accepting match:', error);
      toast.error('Failed to like profile');
    }
  };

  // Reject a match
  const rejectMatch = async (userId: string) => {
    if (!user) return;
    try {
      // Create match record with rejected status
      const { error } = await supabase
        .from('matches')
        .insert({
          user1_id: user.id,
          user2_id: userId,
          status: 'rejected',
          user1_status: 'rejected',
        });
      if (error) throw error;
      setSuggestedMatches((prev) => prev ? prev.filter(match => match.id !== userId) : prev);
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast.error('Failed to skip profile');
    }
  };

  const value = {
    matches,
    possibleMatches,
    myPendingMatches,
    theirPendingMatches,
    suggestedMatches,
    loading,
    fetchMatches: safeFetchMatches, // Use the safe version
    fetchSuggestedMatches,
    matchPreferences,
    updateMatchPreference,
    resetMatchPreferences,
    acceptMatch,
    rejectMatch,
    updateMatchStatus,
    createMatch
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
