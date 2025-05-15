import { supabase } from '@/lib/supabase';
import { generateLocalLLMIcebreakers, isLocalLLMAvailable, checkLocalLLMAvailability } from './local-llm';

// API configuration
const API_URL = "https://api-inference.huggingface.co/models/facebook/opt-1.3b";
const HF_TOKEN = "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";

export interface IcebreakerUser {
  name: string;
  campus: string;
  interests: string[];
  languages: string[];
  goals: string[];
  personality: string;
  background?: string;
  major?: string;
}

export interface IcebreakerResponse {
  conversationStarters: string[];
  activity: string;
  sharedTopic: string;
  rawResponse: string;
}

/**
 * Fetch complete user data for both users in a match
 * Includes profile data, interests, languages, and goals
 */
export async function fetchMatchUserData(matchId: string): Promise<{
  userA: IcebreakerUser | null;
  userB: IcebreakerUser | null;
  location: string;
  meetingDate: string;
}> {
  try {
    console.log("Fetching match data for ID:", matchId);
    
    // Get the match data including user IDs and meetup details
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    
    if (matchError || !matchData) {
      console.error("Error fetching match data:", matchError);
      return { userA: null, userB: null, location: "Campus", meetingDate: "Upcoming" };
    }
    
    console.log("Match data retrieved:", matchData);
    
    // Extract user IDs - use type assertion to handle possible fields
    // Some match records might have user1_id/user2_id, others might have creator_id/partner_id
    const matchDataAny = matchData as any;
    const user1Id = matchDataAny.user1_id || matchDataAny.creator_id;
    const user2Id = matchDataAny.user2_id || matchDataAny.partner_id;
    
    // Get location and meeting date with type assertion for flexibility
    const location = matchDataAny.location || matchDataAny.meetup_location || "Campus café";
    const meetupDate = matchDataAny.date || matchDataAny.meetup_date;
    const meetingDate = meetupDate ? 
      new Date(meetupDate).toLocaleDateString() : 
      matchData.created_at ? 
        new Date(new Date(matchData.created_at).getTime() + 7*24*60*60*1000).toLocaleDateString() : 
        "Upcoming";
    
    // Prepare user data objects
    let userA: IcebreakerUser | null = null;
    let userB: IcebreakerUser | null = null;
    
    // Function to fetch complete profile data directly (including all joins)
    const fetchUserData = async (userId: string): Promise<IcebreakerUser | null> => {
      try {
        // Fetch complete profile data with joins to related tables
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            campus:campuses(*),
            university:universities(*),
            major:majors(*)
          `)
          .eq('id', userId)
          .single();
        
        if (profileError || !profileData) {
          console.error("Error fetching profile data:", profileError);
          return null;
        }
        
        console.log("Base profile data retrieved:", profileData);
        
        // Fetch user interests from the user_interests join table
        const { data: userInterestsData, error: interestsError } = await supabase
          .from('user_interests')
          .select('interest:interests(*)')
          .eq('user_id', userId);
          
        if (interestsError) {
          console.error("Error fetching user interests:", interestsError);
        }
        
        // Fetch user languages from the user_languages join table
        const { data: userLanguagesData, error: languagesError } = await supabase
          .from('user_languages')
          .select('language:languages(*), proficiency')
          .eq('user_id', userId);
          
        if (languagesError) {
          console.error("Error fetching user languages:", languagesError);
        }
        
        // Extract interest names from the join table results
        const interests = userInterestsData && userInterestsData.length > 0
          ? userInterestsData
              .map(item => item.interest?.name || null)
              .filter(Boolean) as string[]
          : [];
          
        // Extract language names from the join table results
        const languages = userLanguagesData && userLanguagesData.length > 0
          ? userLanguagesData
              .map(item => {
                const langName = item.language?.name || null;
                const proficiency = item.proficiency || null;
                return langName ? (proficiency ? `${langName} (${proficiency})` : langName) : null;
              })
              .filter(Boolean) as string[]
          : [];
        
        // Create an enhanced user profile with all the data
        const enhancedProfile = {
          ...profileData,
          // Replace arrays with the properly fetched data
          interests: interests.length > 0 ? interests : null,
          languages: languages.length > 0 ? languages : null,
          // Ensure university and campus are properly mapped
          university_name: profileData.university?.name || null,
          campus_name: profileData.campus?.name || null,
          major_name: profileData.major?.name || null
        };
        
        console.log("Enhanced profile with joined data:", enhancedProfile);
        
        // Convert to icebreaker user format
        return profileToIcebreakerUser(enhancedProfile);
      } catch (error) {
        console.error("Error fetching complete user data:", error);
        return null;
      }
    };
    
    // Fetch both users' data in parallel
    [userA, userB] = await Promise.all([
      fetchUserData(user1Id),
      fetchUserData(user2Id)
    ]);
    
    console.log("Retrieved user data:", { userA, userB });
    
    return {
      userA,
      userB, 
      location,
      meetingDate
    };
  } catch (error) {
    console.error("Error in fetchMatchUserData:", error);
    return { userA: null, userB: null, location: "Campus", meetingDate: "Upcoming" };
  }
}

/**
 * Generate icebreakers for a match using the match ID
 * Fetches all user data and generates personalized icebreakers
 */
export async function generateIcebreakersForMatch(matchId: string): Promise<IcebreakerResponse> {
  try {
    // Fetch match user data
    const { userA, userB, location, meetingDate } = await fetchMatchUserData(matchId);
    
    if (!userA || !userB) {
      throw new Error("Could not retrieve complete user data for this match");
    }
    
    // Generate icebreakers using the LLM
    console.log("Generating icebreakers for match:", matchId);
    await checkLocalLLMAvailability();
    
    return await generateLocalLLMIcebreakers(userA, userB, meetingDate, location);
  } catch (error) {
    console.error("Error generating icebreakers for match:", error);
    throw error;
  }
}

/**
 * Generate icebreakers for a meetup between two users
 * Uses the local LLM (DistilGPT-2)
 */
export async function generateIcebreakers(
  userA: IcebreakerUser,
  userB: IcebreakerUser, 
  meetingDate: string,
  location: string
): Promise<IcebreakerResponse> {
  // Only use the LLM generation method
  console.log("Generating icebreakers with DistilGPT-2...");

  try {
    // Check if the local LLM is available (should always be true now)
    await checkLocalLLMAvailability();
    
    // Use the local LLM generation
    return await generateLocalLLMIcebreakers(userA, userB, meetingDate, location);
  } catch (error) {
    console.error("Error in icebreaker generation:", error);
    // Try the LLM generation again - no rule-based fallback
    return generateLocalLLMIcebreakers(userA, userB, meetingDate, location);
  }
}

/**
 * Generate icebreakers using the Hugging Face API
 * NOT USED - Left here for reference
 */
export async function generateHuggingFaceIcebreakers(
  userA: IcebreakerUser,
  userB: IcebreakerUser,
  meetingDate: string,
  location: string
): Promise<IcebreakerResponse> {
  const prompt = `
Generate icebreaker suggestions for two university students meeting for coffee.

Student A: ${userA.name} from ${userA.campus}
Interests: ${userA.interests.join(', ')}
Languages: ${userA.languages.join(', ')}

Student B: ${userB.name} from ${userB.campus}
Interests: ${userB.interests.join(', ')}
Languages: ${userB.languages.join(', ')}

Meeting details:
Date: ${meetingDate}
Location: ${location}

Format your response as:
1. (First conversation starter)
2. (Second conversation starter)
Activity: (A simple activity they can do during their meetup)
Shared Topic: (A topic they might both be interested in discussing)
`;

  try {
    // Call the Hugging Face Inference API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data[0]?.generated_text || '';

    // Parse the response
    const starters = generatedText.match(/\d+\.\s*(.*)/g)?.map(s => s.replace(/^\d+\.\s*/, '')) || [];
    
    const activityMatch = generatedText.match(/Activity:\s*(.*)/);
    const activity = activityMatch ? activityMatch[1] : 'Share your favorite campus stories.';
    
    const topicMatch = generatedText.match(/Shared Topic:\s*(.*)/);
    const sharedTopic = topicMatch ? topicMatch[1] : 'Your future career aspirations.';

    return {
      conversationStarters: starters.slice(0, 2),
      activity,
      sharedTopic,
      rawResponse: generatedText
    };
  } catch (error) {
    console.error('HuggingFace API error:', error);
    // Fall back to the local LLM generation
    return generateLocalLLMIcebreakers(userA, userB, meetingDate, location);
  }
}

/**
 * Parse the raw response from the LLM into structured data
 */
export function parseIcebreakerResponse(response: string): IcebreakerResponse {
  // Default values in case parsing fails
  const defaultResult: IcebreakerResponse = {
    conversationStarters: [
      "What made you join CampusLink?",
      "What's something unexpected you've learned this semester?"
    ],
    activity: "Take a quick selfie together to commemorate your first meetup!",
    sharedTopic: "Your academic journey and future career plans.",
    rawResponse: response
  };

  try {
    // Extract conversation starters (lines starting with 1. or 2.)
    const starters = response.match(/\d+\.\s+"(.+?)"/g) || [];
    const parsedStarters = starters.map(s => {
      const match = s.match(/\d+\.\s+"(.+?)"/);
      return match ? match[1] : '';
    }).filter(Boolean);

    // Extract activity (line with Mini-Activity or 🎲)
    const activityMatch = response.match(/(?:Mini-Activity|🎲).+?[""":](.+?)[""\n]/);
    const activity = activityMatch ? activityMatch[1].trim() : defaultResult.activity;

    // Extract shared topic (line with Shared Topic or 🎙)
    const topicMatch = response.match(/(?:Shared Topic|🎙).+?[""":](.+?)[""\n]/);
    const sharedTopic = topicMatch ? topicMatch[1].trim() : defaultResult.sharedTopic;

    return {
      conversationStarters: parsedStarters.length >= 2 ? parsedStarters : defaultResult.conversationStarters,
      activity: activity,
      sharedTopic: sharedTopic,
      rawResponse: response
    };
  } catch (error) {
    console.error('Error parsing icebreaker response:', error);
    return defaultResult;
  }
}

/**
 * Convert a profile to an icebreaker user format
 * Handles different data formats intelligently
 */
export function profileToIcebreakerUser(user: any): IcebreakerUser {
  if (!user) {
    console.warn('Attempted to convert undefined or null user to icebreaker format');
    return {
      name: 'Student',
      campus: 'University Campus',
      interests: ['learning', 'meeting new people'],
      languages: ['English'],
      goals: ['Networking', 'Academic success'],
      personality: 'Friendly and curious'
    };
  }

  console.log('Converting enhanced user profile to icebreaker format:', user);
  
  // Extract full name intelligently (first_name + last_name or other available fields)
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const nickname = user.nickname || '';
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                  firstName || lastName || nickname || user.full_name || 
                  user.name || user.display_name || 'Student';
  
  // Extract campus and university intelligently, preferring the pre-extracted names
  const campusName = user.campus_name || 
                    (user.campus && typeof user.campus === 'object' && user.campus.name) || 
                    'University Campus';
                    
  const universityName = user.university_name || 
                        (user.university && typeof user.university === 'object' && user.university.name) || 
                        'University';
                        
  // Create a combined location description for better context
  const campus = `${campusName} (${universityName})`;
  
  // Extract major information
  const major = user.major_name || 
               (user.major && typeof user.major === 'object' && user.major.name) || 
               user.major || null;
  
  // Extract interests intelligently
  // First try the pre-extracted interests array, then direct interests array, then fallback to bio
  let interests: string[] = [];
  
  // Use pre-extracted interests if available
  if (Array.isArray(user.interests) && user.interests.length > 0) {
    interests = [...user.interests];
  }
  
  // If no direct interests but we have bio/cultural_insight, extract potential interests
  if (interests.length === 0) {
    // Build interests from bio and cultural_insight
    const bioText = (user.bio || '').toLowerCase();
    const culturalText = (user.cultural_insight || '').toLowerCase();
    const combinedText = `${bioText} ${culturalText}`;
    
    // Extract interests from text
    if (combinedText.includes('chess')) interests.push('Chess');
    if (combinedText.includes('music')) interests.push('Music');
    if (combinedText.includes('sport')) interests.push('Sports');
    if (combinedText.includes('art')) interests.push('Art');
    if (combinedText.includes('travel')) interests.push('Travel');
    if (combinedText.includes('tech')) interests.push('Technology');
    if (combinedText.includes('book')) interests.push('Reading');
    if (combinedText.includes('food')) interests.push('Culinary Exploration');
    if (combinedText.includes('film') || combinedText.includes('movie')) interests.push('Films');
    if (combinedText.includes('photo')) interests.push('Photography');
    if (combinedText.includes('games') || combinedText.includes('gaming')) interests.push('Gaming');
    if (combinedText.includes('code') || combinedText.includes('program')) interests.push('Programming');
    
    // Add major-based interest if available
    if (major) {
      interests.push(major);
    }
    
    // Always include study as an interest for students if we have nothing else
    if (interests.length === 0) {
      interests.push('Academic studies');
    }
  }
  
  // Extract languages intelligently
  let languages: string[] = [];
  
  // Use pre-extracted languages if available
  if (Array.isArray(user.languages) && user.languages.length > 0) {
    languages = [...user.languages];
  }
  
  // If no languages but we have nationality, infer language
  if (languages.length === 0 && user.nationality) {
    // Map nationality to likely language
    const nationalityLanguageMap: {[key: string]: string} = {
      'Japanese': 'Japanese',
      'Japan': 'Japanese',
      'Vietnam': 'Vietnamese',
      'Vietnamese': 'Vietnamese',
      'Chinese': 'Mandarin',
      'China': 'Mandarin',
      'Korean': 'Korean',
      'Korea': 'Korean',
      'French': 'French',
      'France': 'French',
      'German': 'German',
      'Germany': 'German',
      'Spanish': 'Spanish',
      'Spain': 'Spanish',
      'Italian': 'Italian',
      'Italy': 'Italian',
      'Thai': 'Thai',
      'Thailand': 'Thai',
      'Indonesian': 'Indonesian',
      'Indonesia': 'Indonesian'
    };
    
    const language = nationalityLanguageMap[user.nationality];
    if (language) {
      languages.push(language);
    }
    
    // Always add English as a probable language for university students
    if (!languages.includes('English')) {
      languages.push('English');
    }
  } else if (languages.length === 0) {
    // Default to English if no other info
    languages.push('English');
  }
  
  // Generate goals based on available data
  let goals: string[] = [];
  
  // Direct goals if available
  if (Array.isArray(user.goals) && user.goals.length > 0) {
    goals = user.goals.map((goal: any) => {
      if (typeof goal === 'string') return goal;
      if (typeof goal === 'object' && goal !== null) {
        return goal.name || goal.goal_name || goal.toString();
      }
      return '';
    }).filter(Boolean);
  }
  
  // Add major-based goal if available
  if (major && !goals.some(g => g.includes(major))) {
    goals.push(`Excellence in ${major}`);
  }
  
  // Generate goals from year of study if available
  if (goals.length < 2 && user.year_of_study) {
    const yearOfStudy = Number(user.year_of_study);
    if (yearOfStudy <= 2) {
      goals.push('Building academic foundations');
      goals.push('Exploring diverse subjects');
    } else if (yearOfStudy <= 4) {
      goals.push('Specializing in my field');
      goals.push('Professional network development');
    } else {
      goals.push('Research excellence');
      goals.push('Academic leadership');
    }
  }
  
  // Add cultural exchange goal for international students
  if (user.student_type === 'international' || 
     (user.nationality && user.university && 
      typeof user.university === 'object' && 
      user.nationality !== user.university.country)) {
    goals.push('Cultural exchange');
    goals.push('Global perspective');
  }
  
  // If still no goals, add defaults based on interests
  if (goals.length === 0) {
    if (interests.length > 0) {
      goals.push(`Advancing my knowledge in ${interests[0]}`);
      goals.push('Personal growth');
    } else {
      goals.push('Academic success');
      goals.push('Personal growth');
    }
  }
  
  // Generate background info from available data
  let background = '';
  if (user.nationality) {
    background += `From ${user.nationality}. `;
  }
  if (user.year_of_study) {
    background += `Year ${user.year_of_study} student. `;
  }
  if (major) {
    background += `Studying ${major}. `;
  }
  if (user.bio) {
    background += user.bio;
  }
  
  // Generate personality traits based on bio
  let personality = 'Friendly and curious';
  
  if (user.bio) {
    const bioLower = user.bio.toLowerCase();
    if (bioLower.includes('love') || bioLower.includes('passion')) {
      personality = 'Passionate and enthusiastic';
    } else if (bioLower.includes('study') || bioLower.includes('research')) {
      personality = 'Dedicated and academic';
    } else if (bioLower.includes('fun') || bioLower.includes('social')) {
      personality = 'Playful and sociable';
    } else if (bioLower.includes('creative') || bioLower.includes('art')) {
      personality = 'Creative and expressive';
    }
  } else if (user.cultural_insight) {
    const culturalLower = user.cultural_insight.toLowerCase();
    if (culturalLower.includes('traditional')) {
      personality = 'Traditional and thoughtful';
    } else if (culturalLower.includes('modern')) {
      personality = 'Modern and innovative';
    }
  }
  
  // Create the formatted user object with all extracted data
  return {
    name: fullName,
    campus,
    interests,
    languages,
    goals,
    personality,
    background, // Add background info for richer context
    major // Add major information
  };
} 