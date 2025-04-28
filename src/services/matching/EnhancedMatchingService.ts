import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/types/database';
import { db } from '@/integrations/supabase/enhanced-client';
import { PersonalityTraits } from '@/types/user';
import { Location } from '@/types/user';
import { calculateDistance } from '@/utils/matching/locationUtils';
import { calculatePersonalityScore } from '@/utils/matching/personalityUtils';

interface MatchScore {
  userId: string;
  score: number;
  profile: ProfileType;
  matchFactors: {
    interests: number;
    languages: number;
    location: number;
    personality: number;
    activities: number;
    university: number;
  };
}

const WEIGHTS = {
  interests: 0.3,
  languages: 0.15,
  location: 0.2,
  personality: 0.2,
  activities: 0.1,
  university: 0.05
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class EnhancedMatchingService {
  private static instance: EnhancedMatchingService;
  private activityCache: Map<string, { activities: any[]; timestamp: number }> = new Map();
  private personalityCache: Map<string, { traits: PersonalityTraits; timestamp: number }> = new Map();

  private constructor() {}

  public static getInstance(): EnhancedMatchingService {
    if (!EnhancedMatchingService.instance) {
      EnhancedMatchingService.instance = new EnhancedMatchingService();
    }
    return EnhancedMatchingService.instance;
  }

  public async findMatches(userId: string, limit: number = 10): Promise<MatchScore[]> {
    const user = await this.getUserProfile(userId);
    if (!user) throw new Error('User not found');

    const potentialMatches = await this.getPotentialMatches(userId);
    const matchScores = await Promise.all(
      potentialMatches.map(match => this.calculateMatchScore(user, match))
    );

    return matchScores
      .filter(score => score !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getUserProfile(userId: string): Promise<ProfileType | null> {
    // First get the profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;
    
    // Ensure student_type is correctly typed
    const studentType = data.student_type === 'international' || data.student_type === 'local' 
      ? data.student_type 
      : null;
    
    // Get user languages with proficiency
    const { data: languagesData } = await supabase
      .from('user_languages')
      .select('language_id, proficiency')
      .eq('user_id', userId);
    
    const languages = languagesData?.map(lang => ({
      id: lang.language_id,
      proficiency: lang.proficiency
    })) || [];
    
    // Convert to ProfileType
    return {
      ...data,
      student_type: studentType,
      interests: data.interests || [],
      languages: languages,
      university: null // This column doesn't exist in the profiles table
    } as unknown as ProfileType;
  }

  private async getPotentialMatches(userId: string): Promise<ProfileType[]> {
    // First get the profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId);

    if (error) throw error;
    if (!data) return [];
    
    // Get all user languages with proficiency
    const { data: allLanguagesData } = await supabase
      .from('user_languages')
      .select('user_id, language_id, proficiency')
      .in('user_id', data.map(profile => profile.id));
    
    // Create a map of user_id to languages
    const languagesMap = new Map();
    allLanguagesData?.forEach(lang => {
      if (!languagesMap.has(lang.user_id)) {
        languagesMap.set(lang.user_id, []);
      }
      languagesMap.get(lang.user_id).push({
        id: lang.language_id,
        proficiency: lang.proficiency
      });
    });
    
    // Convert each profile to ensure proper typing
    return data.map(profile => {
      const studentType = profile.student_type === 'international' || profile.student_type === 'local' 
        ? profile.student_type 
        : null;
      
      return {
        ...profile,
        student_type: studentType,
        interests: profile.interests || [],
        languages: languagesMap.get(profile.id) || [],
        university: null // This column doesn't exist in the profiles table
      } as unknown as ProfileType;
    });
  }

  private async calculateMatchScore(user: ProfileType, potentialMatch: ProfileType): Promise<MatchScore> {
    const interestsScore = this.calculateInterestsScore(user.interests || [], potentialMatch.interests || []);
    const languagesScore = this.calculateLanguagesScore(user.languages || [], potentialMatch.languages || []);
    const locationScore = await this.calculateLocationScore(user, potentialMatch);
    const personalityScore = await this.calculatePersonalityScore(user.id, potentialMatch.id);
    const activitiesScore = await this.calculateActivitiesScore(user.id, potentialMatch.id);
    const universityScore = this.calculateUniversityScore(user, potentialMatch);

    const totalScore = 
      interestsScore * WEIGHTS.interests +
      languagesScore * WEIGHTS.languages +
      locationScore * WEIGHTS.location +
      personalityScore * WEIGHTS.personality +
      activitiesScore * WEIGHTS.activities +
      universityScore * WEIGHTS.university;

    return {
      userId: potentialMatch.id,
      score: totalScore,
      profile: potentialMatch,
      matchFactors: {
        interests: interestsScore,
        languages: languagesScore,
        location: locationScore,
        personality: personalityScore,
        activities: activitiesScore,
        university: universityScore
      }
    };
  }

  private calculateInterestsScore(userInterests: string[] = [], matchInterests: string[] = []): number {
    if (!userInterests || !matchInterests || userInterests.length === 0 || matchInterests.length === 0) return 0;
    const commonInterests = userInterests.filter(interest => matchInterests.includes(interest));
    return commonInterests.length / Math.max(userInterests.length, matchInterests.length);
  }

  private calculateLanguagesScore(userLanguages: { id: string; proficiency: string }[] = [], matchLanguages: { id: string; proficiency: string }[] = []): number {
    if (!userLanguages || !matchLanguages || userLanguages.length === 0 || matchLanguages.length === 0) return 0;
    const commonLanguages = userLanguages.filter(lang => 
      matchLanguages.some(matchLang => matchLang.id === lang.id)
    );
    return commonLanguages.length / Math.max(userLanguages.length, matchLanguages.length);
  }

  private async calculateLocationScore(user: ProfileType, match: ProfileType): Promise<number> {
    if (!user.location || !match.location) return 0;

    try {
      const userLocation = this.parseLocation(user.location);
      const matchLocation = this.parseLocation(match.location);
      
      if (!userLocation || !matchLocation) return 0;

      const distance = calculateDistance(userLocation, matchLocation);
      const maxDistance = 50; // 50km maximum distance
      
      return Math.max(0, 1 - (distance / maxDistance));
    } catch (error) {
      console.error('Error calculating location score:', error);
      return 0;
    }
  }

  private parseLocation(locationStr: string): Location | null {
    try {
      const [latitude, longitude] = locationStr.split(',').map(Number);
      if (isNaN(latitude) || isNaN(longitude)) return null;
      return { latitude, longitude };
    } catch (error) {
      console.error('Error parsing location:', error);
      return null;
    }
  }

  private async calculatePersonalityScore(userId: string, matchId: string): Promise<number> {
    const userTraits = await this.getPersonalityTraits(userId);
    const matchTraits = await this.getPersonalityTraits(matchId);

    if (!userTraits || !matchTraits) return 0;
    return calculatePersonalityScore(userTraits, matchTraits);
  }

  private async getPersonalityTraits(userId: string): Promise<PersonalityTraits | null> {
    // Check cache first
    const cached = this.personalityCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.traits;
    }

    // Get personality traits from the database
    const { data, error } = await db.personalityTraits()
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    const traits: PersonalityTraits = {
      openness: data.openness,
      conscientiousness: data.conscientiousness,
      extraversion: data.extraversion,
      agreeableness: data.agreeableness,
      neuroticism: data.neuroticism
    };

    // Cache the result
    this.personalityCache.set(userId, {
      traits,
      timestamp: Date.now()
    });

    return traits;
  }

  private async calculateActivitiesScore(userId: string, matchId: string): Promise<number> {
    const userActivities = await this.getUserActivities(userId);
    const matchActivities = await this.getUserActivities(matchId);

    if (!userActivities || !matchActivities || userActivities.length === 0 || matchActivities.length === 0) return 0;

    const commonActivities = userActivities.filter(activity =>
      matchActivities.some(matchActivity => matchActivity.id === activity.id)
    );

    return commonActivities.length / Math.max(userActivities.length, matchActivities.length);
  }

  private async getUserActivities(userId: string): Promise<any[]> {
    // Check cache first
    const cached = this.activityCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.activities;
    }

    // Get activities from the database
    const { data, error } = await supabase
      .from('user_interests')
      .select('interest_id, interests!inner(name, category)')
      .eq('user_id', userId);

    if (error) return [];

    // Cache the result
    this.activityCache.set(userId, {
      activities: data || [],
      timestamp: Date.now()
    });

    return data || [];
  }

  private calculateUniversityScore(user: ProfileType, match: ProfileType): number {
    if (!user.university_id || !match.university_id) return 0;
    return user.university_id === match.university_id ? 1 : 0;
  }
}

export default EnhancedMatchingService; 