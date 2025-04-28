import { PersonalityTraits } from '@/types/user';

/**
 * Calculates the similarity score between two personality trait sets
 * @param traits1 First set of personality traits
 * @param traits2 Second set of personality traits
 * @returns A score between 0 and 1, where 1 indicates perfect match
 */
export function calculatePersonalityScore(
  traits1: PersonalityTraits,
  traits2: PersonalityTraits
): number {
  const traits = [
    'openness',
    'conscientiousness',
    'extraversion',
    'agreeableness',
    'neuroticism',
  ] as const;

  let totalDifference = 0;
  let maxPossibleDifference = 0;

  for (const trait of traits) {
    const diff = Math.abs(traits1[trait] - traits2[trait]);
    totalDifference += diff;
    maxPossibleDifference += 5; // Assuming each trait is scored 1-5
  }

  // Convert difference to similarity score (0-1)
  const similarityScore = 1 - (totalDifference / maxPossibleDifference);
  return Math.max(0, Math.min(1, similarityScore));
}

/**
 * Checks if two personality profiles are compatible based on a minimum threshold
 * @param traits1 First set of personality traits
 * @param traits2 Second set of personality traits
 * @param threshold Minimum similarity score required (default: 0.6)
 * @returns boolean indicating if profiles are compatible
 */
export function arePersonalitiesCompatible(
  traits1: PersonalityTraits,
  traits2: PersonalityTraits,
  threshold: number = 0.6
): boolean {
  const score = calculatePersonalityScore(traits1, traits2);
  return score >= threshold;
} 