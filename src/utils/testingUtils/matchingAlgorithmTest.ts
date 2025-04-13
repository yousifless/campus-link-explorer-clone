
import { supabase } from '@/integrations/supabase/client';

interface SyntheticProfile {
  first_name: string;
  last_name: string;
  university: string;
  student_type: 'international' | 'local';
  bio: string;
  major: string;
  interests: string[];
  languages: string[];
}

// Sample data for generating synthetic profiles
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Skyler'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const universities = ['MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge', 'Tokyo University', 'ETH Zurich', 'Tsinghua University', 'National University of Singapore', 'University of Toronto'];
const majors = ['Computer Science', 'Engineering', 'Business', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Medicine', 'Law', 'Arts'];
const interests = ['Music', 'Sports', 'Reading', 'Traveling', 'Cooking', 'Photography', 'Gaming', 'Hiking', 'Painting', 'Dancing', 'Coding', 'Films', 'Theater', 'Yoga', 'Meditation'];
const languages = ['English', 'Spanish', 'Mandarin', 'French', 'German', 'Japanese', 'Korean', 'Italian', 'Portuguese', 'Russian', 'Arabic'];
const bios = [
  'Passionate about technology and innovation.',
  'Love exploring new cultures through travel and food.',
  'Always looking to learn new things and meet new people.',
  'Enjoy outdoor activities and staying active.',
  'Creative mind with an interest in arts and design.',
  'Analytical thinker who enjoys solving complex problems.',
  'Adventurous spirit always seeking new experiences.',
  'Dedicated to making a positive impact in the world.',
  'Curious learner with diverse interests.',
  'Balance academics with hobbies and social activities.'
];

// Helper function to get random items from an array
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate a synthetic profile
const generateSyntheticProfile = (): SyntheticProfile => {
  return {
    first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
    last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
    university: universities[Math.floor(Math.random() * universities.length)],
    student_type: Math.random() > 0.5 ? 'international' : 'local',
    bio: bios[Math.floor(Math.random() * bios.length)],
    major: majors[Math.floor(Math.random() * majors.length)],
    interests: getRandomItems(interests, Math.floor(Math.random() * 5) + 1),
    languages: getRandomItems(languages, Math.floor(Math.random() * 3) + 1)
  };
};

// Generate multiple synthetic profiles
export const generateSyntheticProfiles = (count: number): SyntheticProfile[] => {
  return Array.from({ length: count }, () => generateSyntheticProfile());
};

// Create test users in Supabase (for admin/development use only)
export const createTestUsers = async (profiles: SyntheticProfile[]) => {
  try {
    console.log('Starting to create test profiles...');
    
    for (const profile of profiles) {
      // This should only be used in a development environment
      // In a real application, you would need to use proper authentication flows
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `test_${Math.random().toString(36).substring(2, 15)}@example.com`,
        password: 'TestPassword123!'
      });

      if (authError) {
        console.error('Error creating test user:', authError);
        continue;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            university: profile.university,
            student_type: profile.student_type,
            bio: profile.bio,
            major: profile.major,
            interests: profile.interests,
            languages: profile.languages
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        } else {
          console.log(`Created test profile for ${profile.first_name} ${profile.last_name}`);
        }
      }
    }
    
    console.log('Finished creating test profiles');
    return true;
  } catch (error) {
    console.error('Error in createTestUsers:', error);
    return false;
  }
};

// Simulate matching algorithm with synthetic data
export const simulateMatching = (profiles: SyntheticProfile[]): { user1: SyntheticProfile; user2: SyntheticProfile; score: number }[] => {
  const matches: { user1: SyntheticProfile; user2: SyntheticProfile; score: number }[] = [];
  
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const user1 = profiles[i];
      const user2 = profiles[j];
      
      // Calculate match score based on shared interests and languages
      let score = 0;
      
      // Count shared interests
      const sharedInterests = user1.interests.filter(interest => user2.interests.includes(interest));
      score += sharedInterests.length * 10; // Each shared interest adds 10 points
      
      // Count shared languages
      const sharedLanguages = user1.languages.filter(language => user2.languages.includes(language));
      score += sharedLanguages.length * 15; // Each shared language adds 15 points
      
      // Same university bonus
      if (user1.university === user2.university) {
        score += 20;
      }
      
      // International-local pairing bonus
      if (user1.student_type !== user2.student_type) {
        score += 25;
      }
      
      // Same major bonus
      if (user1.major === user2.major) {
        score += 15;
      }
      
      matches.push({ user1, user2, score });
    }
  }
  
  // Sort matches by score (highest first)
  return matches.sort((a, b) => b.score - a.score);
};

// Run a basic A/B test comparing different matching algorithms
export const runABTest = (profiles: SyntheticProfile[]) => {
  // Algorithm A: Prioritize shared interests and languages
  const algorithmA = (user1: SyntheticProfile, user2: SyntheticProfile): number => {
    let score = 0;
    
    // Count shared interests
    const sharedInterests = user1.interests.filter(interest => user2.interests.includes(interest));
    score += sharedInterests.length * 15; // Algorithm A weights interests more
    
    // Count shared languages
    const sharedLanguages = user1.languages.filter(language => user2.languages.includes(language));
    score += sharedLanguages.length * 10;
    
    return score;
  };
  
  // Algorithm B: Prioritize student type pairing and university
  const algorithmB = (user1: SyntheticProfile, user2: SyntheticProfile): number => {
    let score = 0;
    
    // International-local pairing is heavily weighted
    if (user1.student_type !== user2.student_type) {
      score += 40;
    }
    
    // Same university bonus
    if (user1.university === user2.university) {
      score += 30;
    }
    
    // Shared interests still matter but less
    const sharedInterests = user1.interests.filter(interest => user2.interests.includes(interest));
    score += sharedInterests.length * 5;
    
    return score;
  };
  
  // Calculate matches using both algorithms
  const matchesA: { pair: [SyntheticProfile, SyntheticProfile]; score: number }[] = [];
  const matchesB: { pair: [SyntheticProfile, SyntheticProfile]; score: number }[] = [];
  
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const user1 = profiles[i];
      const user2 = profiles[j];
      
      matchesA.push({ 
        pair: [user1, user2], 
        score: algorithmA(user1, user2) 
      });
      
      matchesB.push({ 
        pair: [user1, user2], 
        score: algorithmB(user1, user2) 
      });
    }
  }
  
  // Sort matches by score
  const sortedMatchesA = matchesA.sort((a, b) => b.score - a.score);
  const sortedMatchesB = matchesB.sort((a, b) => b.score - a.score);
  
  return {
    algorithmA: sortedMatchesA,
    algorithmB: sortedMatchesB
  };
};
