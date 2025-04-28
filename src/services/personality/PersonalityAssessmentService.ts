import { db } from '@/integrations/supabase/enhanced-client';
import { PersonalityTraits } from '@/types/user';
import { ProfileType } from '@/types/database';

class PersonalityAssessmentService {
  private static instance: PersonalityAssessmentService;

  private constructor() {}

  public static getInstance(): PersonalityAssessmentService {
    if (!PersonalityAssessmentService.instance) {
      PersonalityAssessmentService.instance = new PersonalityAssessmentService();
    }
    return PersonalityAssessmentService.instance;
  }

  public async assessPersonality(userId: string): Promise<PersonalityTraits | null> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return null;

      const traits = await this.analyzeProfile(profile);
      await this.savePersonalityTraits(userId, traits);

      return traits;
    } catch (error) {
      console.error('Error assessing personality:', error);
      return null;
    }
  }

  private async getUserProfile(userId: string): Promise<ProfileType | null> {
    // Get base profile
    const { data: profile, error: profileError } = await db.profiles()
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) return null;

    // Get user languages
    const { data: languages, error: languagesError } = await db.userLanguages()
      .select('language_id, proficiency')
      .eq('user_id', userId);

    if (languagesError) {
      console.error('Error fetching user languages:', languagesError);
      return null;
    }

    // Get university if set
    let university = null;
    if (profile.university_id) {
      const { data: universityData, error: universityError } = await db.universities()
        .select('id, name')
        .eq('id', profile.university_id)
        .single();

      if (!universityError && universityData) {
        university = {
          id: universityData.id,
          name: universityData.name
        };
      }
    }

    // Get campus if set
    let campus = null;
    if (profile.campus_id) {
      const { data: campusData, error: campusError } = await db.campuses()
        .select('id, name')
        .eq('id', profile.campus_id)
        .single();

      if (!campusError && campusData) {
        campus = {
          id: campusData.id,
          name: campusData.name
        };
      }
    }

    // Ensure student_type is correctly typed
    const studentType = profile.student_type === 'international' || profile.student_type === 'local' 
      ? profile.student_type 
      : null;

    // Construct the profile object with all required fields
    const profileData: ProfileType = {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      nickname: profile.nickname,
      bio: profile.bio,
      nationality: profile.nationality,
      year_of_study: profile.year_of_study,
      university_id: profile.university_id,
      campus_id: profile.campus_id,
      major_id: profile.major_id,
      student_type: studentType,
      cultural_insight: profile.cultural_insight,
      location: profile.location,
      avatar_url: profile.avatar_url,
      is_verified: profile.is_verified,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      interests: profile.interests || [],
      languages: (languages || []).map(lang => ({
        id: lang.language_id,
        proficiency: lang.proficiency
      })),
      university,
      campus
    };

    return profileData;
  }

  private async analyzeProfile(profile: ProfileType): Promise<PersonalityTraits> {
    // Initialize base scores
    const traits: PersonalityTraits = {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    };

    // Analyze bio text
    if (profile.bio) {
      traits.openness += this.countKeywords(profile.bio, openessKeywords) * 0.1;
      traits.conscientiousness += this.countKeywords(profile.bio, conscientiousnessKeywords) * 0.1;
      traits.extraversion += this.countKeywords(profile.bio, extraversionKeywords) * 0.1;
      traits.agreeableness += this.countKeywords(profile.bio, agreeablenessKeywords) * 0.1;
      traits.neuroticism += this.countKeywords(profile.bio, neuroticismKeywords) * 0.1;
    }

    // Analyze cultural insight
    if (profile.cultural_insight) {
      traits.openness += this.countKeywords(profile.cultural_insight, openessKeywords) * 0.15;
      traits.agreeableness += this.countKeywords(profile.cultural_insight, agreeablenessKeywords) * 0.15;
    }

    // Analyze interests
    if (profile.interests && profile.interests.length > 0) {
      traits.openness += this.analyzeInterests(profile.interests) * 0.2;
      traits.extraversion += (profile.interests.length / 10) * 0.1; // More interests suggest higher extraversion
    }

    // Analyze languages
    if (profile.languages && profile.languages.length > 0) {
      traits.openness += (profile.languages.length / 3) * 0.1; // Knowledge of multiple languages suggests openness
      traits.conscientiousness += this.analyzeLanguageProficiency(profile.languages) * 0.1;
    }

    // Normalize scores to be between 0 and 1
    return {
      openness: Math.min(Math.max(traits.openness, 0), 1),
      conscientiousness: Math.min(Math.max(traits.conscientiousness, 0), 1),
      extraversion: Math.min(Math.max(traits.extraversion, 0), 1),
      agreeableness: Math.min(Math.max(traits.agreeableness, 0), 1),
      neuroticism: Math.min(Math.max(traits.neuroticism, 0), 1)
    };
  }

  private countKeywords(text: string, keywords: string[]): number {
    const lowercaseText = text.toLowerCase();
    return keywords.reduce((count, keyword) => 
      count + (lowercaseText.includes(keyword.toLowerCase()) ? 1 : 0), 0
    );
  }

  private analyzeInterests(interests: string[]): number {
    // Calculate diversity of interests across different categories
    const categories = new Set(interests.map(interest => this.getInterestCategory(interest)));
    return categories.size / 5; // Normalize by maximum expected number of categories
  }

  private analyzeLanguageProficiency(languages: { id: string; proficiency: string }[]): number {
    // Calculate average proficiency level
    const proficiencyLevels: { [key: string]: number } = {
      'beginner': 0.25,
      'intermediate': 0.5,
      'advanced': 0.75,
      'native': 1
    };

    return languages.reduce((sum, lang) => 
      sum + (proficiencyLevels[lang.proficiency.toLowerCase()] || 0), 0
    ) / languages.length;
  }

  private getInterestCategory(interestId: string): string {
    // This should be replaced with actual interest category lookup
    return 'general';
  }

  private async savePersonalityTraits(userId: string, traits: PersonalityTraits): Promise<void> {
    const { error } = await db.personalityTraits()
      .upsert({
        user_id: userId,
        ...traits,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving personality traits:', error);
      throw error;
    }
  }
}

// Keywords for personality trait analysis
const openessKeywords = [
  'creative', 'curious', 'adventurous', 'artistic', 'imaginative',
  'innovative', 'explore', 'learn', 'discover', 'experience'
];

const conscientiousnessKeywords = [
  'organized', 'responsible', 'disciplined', 'efficient', 'planned',
  'thorough', 'detail', 'systematic', 'punctual', 'reliable'
];

const extraversionKeywords = [
  'outgoing', 'social', 'energetic', 'enthusiastic', 'talkative',
  'friendly', 'party', 'group', 'people', 'active'
];

const agreeablenessKeywords = [
  'kind', 'cooperative', 'sympathetic', 'helpful', 'warm',
  'considerate', 'friendly', 'generous', 'trusting', 'understanding'
];

const neuroticismKeywords = [
  'anxious', 'sensitive', 'nervous', 'moody', 'emotional',
  'stressed', 'worry', 'tense', 'self-conscious', 'vulnerable'
];

export default PersonalityAssessmentService; 