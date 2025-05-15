import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/types/database';
import { calculateDistance } from './locationUtils';
import { arePersonalitiesCompatible } from './personalityUtils';
import { Location, MatchWeights } from '@/types/user';

// Default weights if user hasn't set preferences
export const DEFAULT_WEIGHTS: MatchWeights = {
  location: 0.2,
  interests: 0.25,
  languages: 0.15,
  goals: 0.1,
  availability: 0.1,
  personality: 0.1,
  network: 0.1
};

// Type for match scores
export interface HybridMatchScore {
  userId: string;
  totalScore: number;
  profile: ProfileType;
  explanationFactors: {
    location: number;
    interests: number;
    languages: number;
    goals: number;
    availability: number;
    personality: number;
    network: number;
  };
}

/**
 * Calculate location score based on distance or campus/university similarity
 */
export function locationScore(userLocation: Location | string | null, matchLocation: Location | string | null, 
                            userCampusId: string | null, matchCampusId: string | null,
                            userUniversityId: string | null, matchUniversityId: string | null): number {
  // First priority: same campus
  if (userCampusId && matchCampusId && userCampusId === matchCampusId) {
    return 1.0;
  }
  
  // Second priority: same university
  if (userUniversityId && matchUniversityId && userUniversityId === matchUniversityId) {
    return 0.8;
  }
  
  // Third priority: physical distance if available
  if (userLocation && matchLocation) {
    let userLoc: Location;
    let matchLoc: Location;
    
    if (typeof userLocation === 'string') {
      const [lat, lng] = userLocation.split(',').map(Number);
      userLoc = { latitude: lat, longitude: lng };
    } else {
      userLoc = userLocation;
    }
    
    if (typeof matchLocation === 'string') {
      const [lat, lng] = matchLocation.split(',').map(Number);
      matchLoc = { latitude: lat, longitude: lng };
    } else {
      matchLoc = matchLocation;
    }
    
    const distance = calculateDistance(userLoc, matchLoc);
    const MAX_DISTANCE = 50; // 50km
    return Math.max(0, 1 - (distance / MAX_DISTANCE));
  }
  
  return 0;
}

/**
 * Calculate similarity between interests using cosine similarity
 * If embeddings are available, use those; otherwise fall back to simpler matching
 */
export function interestSimilarity(
  userInterests: string[],
  matchInterests: string[],
  userEmbedding?: number[],
  matchEmbedding?: number[]
): number {
  // If embeddings are available, use cosine similarity
  if (userEmbedding && matchEmbedding && userEmbedding.length > 0 && matchEmbedding.length > 0) {
    return cosineSimilarity(userEmbedding, matchEmbedding);
  }
  
  // Fall back to simpler interest matching
  if (!userInterests || !matchInterests || userInterests.length === 0 || matchInterests.length === 0) {
    return 0;
  }
  
  const commonInterests = userInterests.filter(interest => matchInterests.includes(interest));
  return commonInterests.length / Math.max(userInterests.length, matchInterests.length);
}

/**
 * Calculate language compatibility score
 */
export function languageScore(
  userLanguages: { id: string; proficiency: string }[],
  matchLanguages: { id: string; proficiency: string }[]
): number {
  if (!userLanguages || !matchLanguages || userLanguages.length === 0 || matchLanguages.length === 0) {
    return 0;
  }
  
  const commonLanguages = userLanguages.filter(lang => 
    matchLanguages.some(matchLang => matchLang.id === lang.id)
  );
  
  return commonLanguages.length / Math.max(userLanguages.length, matchLanguages.length);
}

/**
 * Calculate goals compatibility
 * Placeholder - expand based on how goals are stored in your system
 */
export function goalsScore(userGoals: string[], matchGoals: string[]): number {
  if (!userGoals || !matchGoals || userGoals.length === 0 || matchGoals.length === 0) {
    return 0;
  }
  
  const commonGoals = userGoals.filter(goal => matchGoals.includes(goal));
  return commonGoals.length / Math.max(userGoals.length, matchGoals.length);
}

/**
 * Calculate availability overlap
 * Placeholder - expand based on how availability is stored in your system
 */
export function availabilityScore(userAvailability: any, matchAvailability: any): number {
  // Placeholder implementation - replace with actual availability comparison logic
  return 0.5; // Default middle score when not implemented
}

/**
 * Calculate personality compatibility
 */
export function personalityScore(userPersonality: any, matchPersonality: any): number {
  if (!userPersonality || !matchPersonality) {
    return 0.5; // Default middle score when data is missing
  }
  
  // If using personality traits (Big Five)
  if (userPersonality.openness !== undefined) {
    return arePersonalitiesCompatible(userPersonality, matchPersonality) ? 1 : 0.5;
  }
  
  // If using personality types (like MBTI)
  if (userPersonality.type && matchPersonality.type) {
    return userPersonality.type === matchPersonality.type ? 1 : 0.5;
  }
  
  return 0.5;
}

/**
 * Calculate network score based on common connections
 * Placeholder - expand based on how network connections are stored
 */
export function networkScore(userId: string, matchId: string, connections: Map<string, string[]>): number {
  const userConnections = connections.get(userId) || [];
  const matchConnections = connections.get(matchId) || [];
  
  if (userConnections.length === 0 || matchConnections.length === 0) {
    return 0;
  }
  
  const commonConnections = userConnections.filter(id => matchConnections.includes(id));
  return commonConnections.length / Math.max(userConnections.length, matchConnections.length);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Normalize weights to ensure they sum to 1
 */
export function normalizeWeights(weights: MatchWeights): MatchWeights {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  
  if (sum === 0) {
    return DEFAULT_WEIGHTS;
  }
  
  return {
    location: weights.location / sum,
    interests: weights.interests / sum,
    languages: weights.languages / sum,
    goals: weights.goals / sum,
    availability: weights.availability / sum,
    personality: weights.personality / sum,
    network: weights.network / sum
  };
}

/**
 * Main hybrid matching function
 */
export async function findHybridMatches(
  userId: string,
  userProfile: ProfileType,
  potentialMatches: ProfileType[],
  weights: MatchWeights = DEFAULT_WEIGHTS,
  limit: number = 20
): Promise<HybridMatchScore[]> {
  // Normalize weights
  const normalizedWeights = normalizeWeights(weights);
  
  // Build network connections map
  const connections = await buildConnectionsMap([userId, ...potentialMatches.map(p => p.id)]);
  
  // Get personality data
  const personalityData = await getPersonalityData([userId, ...potentialMatches.map(p => p.id)]);
  
  // Get embeddings if available
  const embeddings = await getProfileEmbeddings([userId, ...potentialMatches.map(p => p.id)]);
  
  // Calculate match scores
  const matchScores = potentialMatches.map(match => {
    // Calculate individual scores
    const locScore = locationScore(
      userProfile.location,
      match.location,
      userProfile.campus_id,
      match.campus_id,
      userProfile.university_id,
      match.university_id
    );
    
    const intScore = interestSimilarity(
      userProfile.interests || [],
      match.interests || [],
      embeddings.get(userId),
      embeddings.get(match.id)
    );
    
    const langScore = languageScore(
      userProfile.languages || [],
      match.languages || []
    );
    
    const goalScore = goalsScore(
      [], // Replace with actual goals when available
      []  // Replace with actual goals when available
    );
    
    const availScore = availabilityScore(null, null); // Replace with availability data
    
    const persScore = personalityScore(
      personalityData.get(userId),
      personalityData.get(match.id)
    );
    
    const netScore = networkScore(userId, match.id, connections);
    
    // Calculate weighted score
    const totalScore =
      normalizedWeights.location * locScore +
      normalizedWeights.interests * intScore +
      normalizedWeights.languages * langScore +
      normalizedWeights.goals * goalScore +
      normalizedWeights.availability * availScore +
      normalizedWeights.personality * persScore +
      normalizedWeights.network * netScore;
    
    return {
      userId: match.id,
      totalScore,
      profile: match,
      explanationFactors: {
        location: locScore,
        interests: intScore,
        languages: langScore,
        goals: goalScore,
        availability: availScore,
        personality: persScore,
        network: netScore
      }
    };
  });
  
  // Sort and limit results
  return matchScores
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
}

/**
 * Helper function to build a map of user connections
 */
async function buildConnectionsMap(userIds: string[]): Promise<Map<string, string[]>> {
  const connections = new Map<string, string[]>();
  
  // Placeholder - replace with actual code to fetch connections
  // For example, query a connections or friends table
  
  return connections;
}

/**
 * Helper function to get personality data for users
 */
async function getPersonalityData(userIds: string[]): Promise<Map<string, any>> {
  const personalityData = new Map<string, any>();
  
  try {
    // Try to check if the table exists first
    try {
      const { error } = await supabase
        .from('profiles')  // Use a table we know exists
        .select('id')
        .limit(1);
        
      if (error) {
        console.error('Error checking database connection:', error);
        return personalityData;
      }
    } catch (e) {
      console.error('Database connection error:', e);
      return personalityData;
    }
    
    // Instead of directly querying a table that might not exist,
    // use a much simpler approach - just return empty data
    // This avoids the type errors and simplifies the function
    
    // In a real implementation, you would need to ensure the profiles table
    // has the personality trait columns, or you'd query from a dedicated table
    console.log('Personality data retrieval skipped - implement in production');
  } catch (error) {
    console.error('Error in personality data retrieval:', error);
  }
  
  return personalityData;
}

/**
 * Helper function to get profile embeddings
 */
async function getProfileEmbeddings(userIds: string[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  
  try {
    // First check if a known table exists to verify connection
    const { error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Error checking database connection:', testError);
      return embeddings;
    }
    
    // Since we don't know if the embeddings functionality is implemented,
    // we'll just return an empty map in this version
    console.log('Skipping profile embeddings retrieval - implement in production');
    
    // In a real implementation, you would query a table with embeddings or use an RPC call
    // that exists in your database
    
  } catch (error) {
    console.error('Error processing embeddings:', error);
  }
  
  return embeddings;
} 