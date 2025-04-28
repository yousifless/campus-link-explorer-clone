import { ProfileType } from '@/types/database';

// Personality traits to analyze
export type PersonalityTrait = {
  trait: string;
  score: number;
};

// Keywords associated with different personality traits
const personalityKeywords: Record<string, string[]> = {
  outgoing: ['friendly', 'social', 'extroverted', 'outgoing', 'energetic', 'active'],
  creative: ['creative', 'artistic', 'innovative', 'imaginative', 'design'],
  analytical: ['analytical', 'logical', 'problem-solving', 'critical', 'research'],
  adventurous: ['adventurous', 'explorer', 'travel', 'hiking', 'outdoor'],
  helpful: ['helpful', 'supportive', 'mentor', 'guide', 'assist'],
  leadership: ['leader', 'leadership', 'organize', 'manage', 'direct'],
  tech: ['tech', 'programming', 'coding', 'software', 'developer'],
  academic: ['study', 'academic', 'research', 'thesis', 'paper'],
};

export function analyzePersonality(profile: ProfileType): PersonalityTrait[] {
  const bio = profile.bio?.toLowerCase() || '';
  const traits: PersonalityTrait[] = [];

  // Analyze each personality trait
  Object.entries(personalityKeywords).forEach(([trait, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (bio.includes(keyword) ? 1 : 0);
    }, 0) / keywords.length;

    if (score > 0) {
      traits.push({ trait, score });
    }
  });

  // Sort traits by score
  return traits.sort((a, b) => b.score - a.score);
}

export function calculatePersonalityMatch(
  userTraits: PersonalityTrait[],
  matchTraits: PersonalityTrait[]
): number {
  if (userTraits.length === 0 || matchTraits.length === 0) return 0;

  let totalScore = 0;
  let matchCount = 0;

  // Compare each trait
  userTraits.forEach(userTrait => {
    const matchTrait = matchTraits.find(t => t.trait === userTrait.trait);
    if (matchTrait) {
      totalScore += Math.min(userTrait.score, matchTrait.score);
      matchCount++;
    }
  });

  // Return average match score
  return matchCount > 0 ? totalScore / matchCount : 0;
} 