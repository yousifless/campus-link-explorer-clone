import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/types/database';
import { calculateDistance } from './locationUtils';
import { analyzePersonality } from './personalityAnalysis';
import { getActivitySimilarity } from './activityMatching';

// Types for the enhanced matching system
interface EnhancedMatchScore {
  baseScore: number;
  locationScore: number;
  personalityScore: number;
  activityScore: number;
  totalScore: number;
  matchDetails: {
    sharedInterests: number;
    sharedLanguages: number;
    distance: number | null;
    personalityMatch: number;
    activityOverlap: number;
  };
}

interface MatchResult {
  user: ProfileType;
  score: EnhancedMatchScore;
}

// Weights for different matching factors
const MATCHING_WEIGHTS = {
  interests: 0.25,
  languages: 0.20,
  location: 0.15,
  personality: 0.20,
  activities: 0.20
};

// Maximum distance (in kilometers) to consider for location matching
const MAX_DISTANCE = 50;

export class EnhancedMatchingAlgorithm {
  private static instance: EnhancedMatchingAlgorithm;
  private matchHistory: Map<string, number> = new Map();
  private personalityCache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): EnhancedMatchingAlgorithm {
    if (!EnhancedMatchingAlgorithm.instance) {
      EnhancedMatchingAlgorithm.instance = new EnhancedMatchingAlgorithm();
    }
    return EnhancedMatchingAlgorithm.instance;
  }

  // Main matching function
  public async findMatches(userId: string, limit: number = 10): Promise<MatchResult[]> {
    try {
      // Get user profile and preferences
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) throw new Error('User profile not found');

      // Get potential matches
      const potentialMatches = await this.getPotentialMatches(userId);
      
      // Calculate scores for each potential match
      const scoredMatches = await Promise.all(
        potentialMatches.map(async (match) => ({
          user: match,
          score: await this.calculateMatchScore(userProfile, match)
        }))
      );

      // Sort by total score and apply ML-based adjustments
      const sortedMatches = this.applyMLAdjustments(scoredMatches);

      // Return top matches
      return sortedMatches.slice(0, limit);
    } catch (error) {
      console.error('Error in findMatches:', error);
      throw error;
    }
  }

  private async getUserProfile(userId: string): Promise<ProfileType | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getPotentialMatches(userId: string): Promise<ProfileType[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(50); // Limit initial pool for performance

    if (error) throw error;
    return data || [];
  }

  private async calculateMatchScore(user: ProfileType, match: ProfileType): Promise<EnhancedMatchScore> {
    // Calculate base score (interests and languages)
    const baseScore = await this.calculateBaseScore(user, match);

    // Calculate location score
    const locationScore = await this.calculateLocationScore(user, match);

    // Calculate personality score
    const personalityScore = await this.calculatePersonalityScore(user, match);

    // Calculate activity score
    const activityScore = await this.calculateActivityScore(user, match);

    // Calculate total score with weights
    const totalScore = 
      baseScore * (MATCHING_WEIGHTS.interests + MATCHING_WEIGHTS.languages) +
      locationScore * MATCHING_WEIGHTS.location +
      personalityScore * MATCHING_WEIGHTS.personality +
      activityScore * MATCHING_WEIGHTS.activities;

    return {
      baseScore,
      locationScore,
      personalityScore,
      activityScore,
      totalScore,
      matchDetails: {
        sharedInterests: this.countSharedInterests(user, match),
        sharedLanguages: this.countSharedLanguages(user, match),
        distance: await this.getDistance(user, match),
        personalityMatch: personalityScore,
        activityOverlap: activityScore
      }
    };
  }

  private async calculateBaseScore(user: ProfileType, match: ProfileType): Promise<number> {
    const sharedInterests = this.countSharedInterests(user, match);
    const sharedLanguages = this.countSharedLanguages(user, match);

    // Normalize scores to 0-1 range
    const interestScore = sharedInterests / Math.max(user.interests.length, 1);
    const languageScore = sharedLanguages / Math.max(user.languages.length, 1);

    return (interestScore + languageScore) / 2;
  }

  private async calculateLocationScore(user: ProfileType, match: ProfileType): Promise<number> {
    const distance = await this.getDistance(user, match);
    if (!distance) return 0;

    // Score decreases linearly with distance up to MAX_DISTANCE
    return Math.max(0, 1 - (distance / MAX_DISTANCE));
  }

  private async calculatePersonalityScore(user: ProfileType, match: ProfileType): Promise<number> {
    // Get or calculate personality traits for both users
    const userPersonality = await this.getPersonalityTraits(user);
    const matchPersonality = await this.getPersonalityTraits(match);

    // Calculate personality compatibility
    return analyzePersonality(userPersonality, matchPersonality);
  }

  private async calculateActivityScore(user: ProfileType, match: ProfileType): Promise<number> {
    // Get recent activities for both users
    const userActivities = await this.getUserActivities(user.id);
    const matchActivities = await this.getUserActivities(match.id);

    // Calculate activity similarity
    return getActivitySimilarity(userActivities, matchActivities);
  }

  private countSharedInterests(user: ProfileType, match: ProfileType): number {
    return user.interests.filter(interest => 
      match.interests.includes(interest)
    ).length;
  }

  private countSharedLanguages(user: ProfileType, match: ProfileType): number {
    return user.languages.filter(lang => 
      match.languages.some(matchLang => matchLang.id === lang.id)
    ).length;
  }

  private async getDistance(user: ProfileType, match: ProfileType): Promise<number | null> {
    if (!user.location || !match.location) return null;

    try {
      return calculateDistance(
        user.location.latitude,
        user.location.longitude,
        match.location.latitude,
        match.location.longitude
      );
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }

  private async getPersonalityTraits(profile: ProfileType): Promise<any> {
    // Check cache first
    if (this.personalityCache.has(profile.id)) {
      return this.personalityCache.get(profile.id);
    }

    // Analyze bio and other text content
    const traits = await analyzePersonality(profile);
    
    // Cache the result
    this.personalityCache.set(profile.id, traits);
    
    return traits;
  }

  private async getUserActivities(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  private applyMLAdjustments(matches: MatchResult[]): MatchResult[] {
    return matches.map(match => {
      // Get historical match success rate
      const successRate = this.matchHistory.get(match.user.id) || 0.5;
      
      // Adjust score based on historical success
      const adjustedScore = {
        ...match.score,
        totalScore: match.score.totalScore * (1 + successRate * 0.2) // Boost up to 20% based on success rate
      };

      return {
        ...match,
        score: adjustedScore
      };
    }).sort((a, b) => b.score.totalScore - a.score.totalScore);
  }

  // Update match success rate based on user feedback
  public async updateMatchSuccess(matchId: string, success: boolean): Promise<void> {
    const currentRate = this.matchHistory.get(matchId) || 0.5;
    const newRate = currentRate * 0.9 + (success ? 1 : 0) * 0.1; // Exponential moving average
    this.matchHistory.set(matchId, newRate);
  }
} 