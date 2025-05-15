import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { findHybridMatches, HybridMatchScore } from '@/utils/matching/hybridMatchingAlgorithm';
import { ProfileType } from '@/types/database';
import { MatchWeights } from '@/types/user';
import { UserPreferencesService } from '@/services/matching/UserPreferencesService';

/**
 * Custom hook for working with the hybrid matching algorithm
 */
export const useHybridMatching = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [matches, setMatches] = useState<HybridMatchScore[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<ProfileType[]>([]);
  const [weights, setWeights] = useState<MatchWeights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preferencesService = UserPreferencesService.getInstance();

  // Load user's matching preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const userPrefs = await preferencesService.getUserPreferences(user.id);
      setWeights(userPrefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load matching preferences');
    }
  }, [user?.id]);

  // Fetch potential matches
  const fetchPotentialMatches = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch profiles that could be matches
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);
      
      if (error) throw error;
      
      // Get user languages
      const { data: userLanguagesData } = await supabase
        .from('user_languages')
        .select('user_id, language_id, proficiency')
        .in('user_id', data.map(profile => profile.id).concat(user.id));
      
      // Create a map for easy lookup
      const userLanguagesMap = new Map();
      userLanguagesData?.forEach(lang => {
        if (!userLanguagesMap.has(lang.user_id)) {
          userLanguagesMap.set(lang.user_id, []);
        }
        userLanguagesMap.get(lang.user_id).push({
          id: lang.language_id,
          proficiency: lang.proficiency
        });
      });
      
      // Transform profiles to include languages
      const potentialMatches = data.map(profile => {
        // Create university and campus objects from the ids
        return {
          ...profile,
          university: { id: profile.university_id, name: '' },
          campus: { id: profile.campus_id, name: '' }
        } as unknown as ProfileType;
      });
      
      setPotentialMatches(potentialMatches);
    } catch (err) {
      console.error('Error fetching potential matches:', err);
      setError('Failed to fetch potential matches');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Find matches using the hybrid algorithm
  const findMatches = useCallback(async (customWeights?: MatchWeights) => {
    if (!user?.id || !profile || potentialMatches.length === 0) return;
    
    try {
      setLoading(true);
      
      // Use provided weights or load from preferences
      const matchWeights = customWeights || weights || await preferencesService.getUserPreferences(user.id);
      
      // Get current user's languages
      const userLanguages = await supabase
        .from('user_languages')
        .select('language_id, proficiency')
        .eq('user_id', user.id);
      
      // Create a complete profile with languages
      const userProfile = {
        ...profile,
        languages: userLanguages?.data?.map(lang => ({
          id: lang.language_id,
          proficiency: lang.proficiency
        })) || []
      } as ProfileType;
      
      // Call the hybrid matching algorithm
      const hybridMatches = await findHybridMatches(user.id, userProfile, potentialMatches, matchWeights);
      
      setMatches(hybridMatches);
    } catch (err) {
      console.error('Error finding matches:', err);
      setError('Failed to run matching algorithm');
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile, potentialMatches, weights]);

  // Update a single weight and re-run matching
  const updateWeight = useCallback(async (factor: keyof MatchWeights, value: number) => {
    if (!user?.id || !weights) return;
    
    try {
      setLoading(true);
      
      // Update the weight
      const updatedWeights = await preferencesService.updatePreferenceWeight(user.id, factor, value);
      
      // Update local state
      setWeights(updatedWeights);
      
      // Re-run matching with new weights
      await findMatches(updatedWeights);
    } catch (err) {
      console.error('Error updating weight:', err);
      setError('Failed to update matching preference');
    } finally {
      setLoading(false);
    }
  }, [user?.id, weights, findMatches]);

  // Reset weights to defaults
  const resetWeights = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Reset to defaults
      await preferencesService.resetUserPreferences(user.id);
      
      // Reload preferences
      await loadPreferences();
      
      // Re-run matching
      await findMatches();
    } catch (err) {
      console.error('Error resetting weights:', err);
      setError('Failed to reset matching preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPreferences, findMatches]);

  // Initialize
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
      fetchPotentialMatches();
    }
  }, [user?.id, loadPreferences, fetchPotentialMatches]);

  // Run matching when potential matches change
  useEffect(() => {
    if (potentialMatches.length > 0 && weights) {
      findMatches();
    }
  }, [potentialMatches, weights, findMatches]);

  return {
    matches,
    weights,
    loading,
    error,
    updateWeight,
    resetWeights,
    findMatches
  };
};
