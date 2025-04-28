import { UserProfile } from '@/types/user';
import { calculateDistance } from './locationUtils';
import { calculatePersonalityScore } from './personalityUtils';

export type MatchScore = {
  userId: string;
  score: number;
  locationScore: number;
  personalityScore: number;
};

const MAX_DISTANCE = 50; // Maximum distance in kilometers
const LOCATION_WEIGHT = 0.4;
const PERSONALITY_WEIGHT = 0.6;

export function calculateMatchScores(
  currentUser: UserProfile,
  potentialMatches: UserProfile[]
): MatchScore[] {
  return potentialMatches
    .filter((match) => match.id !== currentUser.id)
    .map((match) => {
      const locationScore = calculateLocationScore(currentUser, match);
      const personalityScore = calculatePersonalityScore(currentUser, match);
      const totalScore = 
        locationScore * LOCATION_WEIGHT + 
        personalityScore * PERSONALITY_WEIGHT;

      return {
        userId: match.id,
        score: totalScore,
        locationScore,
        personalityScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function calculateLocationScore(
  currentUser: UserProfile,
  match: UserProfile
): number {
  if (!currentUser.location || !match.location) {
    return 0;
  }

  const distance = calculateDistance(
    currentUser.location.latitude,
    currentUser.location.longitude,
    match.location.latitude,
    match.location.longitude
  );

  if (distance > MAX_DISTANCE) {
    return 0;
  }

  return 1 - (distance / MAX_DISTANCE);
}

export function getTopMatches(
  scores: MatchScore[],
  limit: number = 10
): MatchScore[] {
  return scores.slice(0, limit);
} 