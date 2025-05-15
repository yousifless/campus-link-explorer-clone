import { supabase } from '@/integrations/supabase/client';
import { MatchWeights } from '@/types/user';
import { DEFAULT_WEIGHTS, normalizeWeights } from '@/utils/matching/hybridMatchingAlgorithm';

/**
 * Service for managing user matching preferences
 */
export class UserPreferencesService {
  private static instance: UserPreferencesService;
  private cache: Map<string, { weights: MatchWeights; timestamp: number }> = new Map();
  private cacheDuration = 60000; // 1 minute cache

  private constructor() {}

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  /**
   * Get user matching preferences
   */
  public async getUserPreferences(userId: string): Promise<MatchWeights> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.weights;
    }
    
    // Fetch from database
    const { data, error } = await supabase
      .from('user_match_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      // If no preferences found, use defaults and save them
      await this.saveUserPreferences(userId, DEFAULT_WEIGHTS);
      return DEFAULT_WEIGHTS;
    }
    
    // Create weights object
    const weights: MatchWeights = {
      location: data.location,
      interests: data.interests,
      languages: data.languages,
      goals: data.goals,
      availability: data.availability,
      personality: data.personality,
      network: data.network
    };
    
    // Update cache
    this.cache.set(userId, {
      weights,
      timestamp: Date.now()
    });
    
    return weights;
  }

  /**
   * Save user matching preferences
   */
  public async saveUserPreferences(userId: string, weights: MatchWeights): Promise<void> {
    // Normalize weights to ensure they sum to 1
    const normalizedWeights = normalizeWeights(weights);
    
    // Save to database
    const { error } = await supabase
      .from('user_match_preferences')
      .upsert({
        user_id: userId,
        location: normalizedWeights.location,
        interests: normalizedWeights.interests,
        languages: normalizedWeights.languages,
        goals: normalizedWeights.goals,
        availability: normalizedWeights.availability,
        personality: normalizedWeights.personality,
        network: normalizedWeights.network,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving user preferences:', error);
      return;
    }
    
    // Update cache
    this.cache.set(userId, {
      weights: normalizedWeights,
      timestamp: Date.now()
    });
  }

  /**
   * Update a single preference weight
   */
  public async updatePreferenceWeight(
    userId: string, 
    factor: keyof MatchWeights, 
    weight: number
  ): Promise<MatchWeights> {
    // Get current preferences
    const currentPrefs = await this.getUserPreferences(userId);
    
    // Update the specified factor
    const updatedPrefs: MatchWeights = {
      ...currentPrefs,
      [factor]: weight
    };
    
    // Save updated preferences
    await this.saveUserPreferences(userId, updatedPrefs);
    
    // Return the normalized weights
    return normalizeWeights(updatedPrefs);
  }

  /**
   * Reset user preferences to defaults
   */
  public async resetUserPreferences(userId: string): Promise<void> {
    await this.saveUserPreferences(userId, DEFAULT_WEIGHTS);
  }
} 