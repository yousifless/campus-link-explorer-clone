export interface Location {
  latitude: number;
  longitude: number;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface MatchWeights {
  location: number;
  interests: number;
  languages: number;
  goals: number;
  availability: number;
  personality: number;
  network: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  location?: Location;
  personality?: PersonalityTraits;
  interests?: string[];
  studyPreferences?: {
    preferredStudyTime?: string;
    preferredStudyLocation?: string;
    groupSize?: number;
  };
  createdAt: Date;
  updatedAt: Date;
} 