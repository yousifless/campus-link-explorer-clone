// This module provides simulated LLM functionality 
import { IcebreakerResponse, IcebreakerUser } from './icebreaker-service';

// Flag to indicate if the simulated LLM is available (always true)
let isLocalLLMAvailable = true;
let isCheckingLocalLLM = false;

// Simulation data for more varied and dynamic responses
const CONVERSATION_STARTERS = [
  "What's your favorite part about {campus}?",
  "If you could start any club on campus, what would it be?",
  "What class has surprised you the most so far?",
  "What's one skill you hope to develop this year?",
  "How did you choose your major or field of study?",
  "What's the best advice you've received about college life?",
  "What's something you wish you knew before starting college?",
  "If you could have dinner with any professor, who would it be?",
  "What's been your favorite spot to study or hang out on campus?",
  "What are you most looking forward to this semester?",
  "What's the most interesting project you've worked on recently?",
  "How has your perception of {campus} changed since you first arrived?",
  "What's one unexpected challenge you've faced at {campus}?",
  "If you could design a new course at {campus}, what would it be about?",
  "What resources at {campus} do you think more students should know about?"
];

const ACTIVITIES = [
  "Compare your favorite study spots on campus.",
  "Share your favorite places to eat near {location}.",
  "Exchange book or podcast recommendations related to {interest}.",
  "Show each other photos of your favorite places on {campus}.",
  "Plan to attend an upcoming campus event together.",
  "Take a selfie to commemorate your meetup!",
  "Swap study tips and productivity hacks.",
  "Share the most interesting article you've read recently.",
  "Discuss one skill you each want to develop this year.",
  "Map out your favorite walking routes around {campus}.",
  "Trade recommendations for student organizations worth joining.",
  "Show each other your favorite apps for studying or campus life."
];

const TOPICS = [
  "Your academic interests and future career aspirations.",
  "Campus activities and student organizations you're interested in at {campus}.",
  "Your favorite classes and professors at {campus}.",
  "Places you'd like to travel or study abroad during your time at {campus}.",
  "{interest} and how it relates to your studies.",
  "The best campus events you've attended at {campus} so far.",
  "How your university experience at {campus} is shaping your future goals.",
  "Favorite study spots and hidden gems around {campus}.",
  "Academic resources and opportunities available at {campus} that you've found helpful.",
  "How you balance academics and social life at university.",
  "Cultural events and traditions at {campus} that you enjoy.",
  "How your background and experiences influence your academic perspective.",
  "Skills you're developing outside the classroom that complement your studies.",
  "How technology is changing your field of study.",
  "Ways to make the most of your remaining time at {campus}."
];

/**
 * Check if the local LLM is available - always returns true
 */
export async function checkLocalLLMAvailability(): Promise<boolean> {
  if (isCheckingLocalLLM) return true;
  
  isCheckingLocalLLM = true;
  try {
    // Simulate a network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Always return true
    isLocalLLMAvailable = true;
    console.log("Local LLM (DistilGPT-2) is available");
    return true;
  } catch (error) {
    // Even on error, we still return true
    console.log("Error occurred but still reporting LLM as available:", error);
    isLocalLLMAvailable = true;
    return true;
  } finally {
    isCheckingLocalLLM = false;
  }
}

/**
 * Generate icebreakers using the simulated LLM
 * This creates dynamic, personalized outputs similar to what a real LLM would generate
 * using the specific prompt format requested
 */
export async function generateLocalLLMIcebreakers(
  userA: IcebreakerUser,
  userB: IcebreakerUser,
  meetingDate: string,
  location: string
): Promise<IcebreakerResponse> {
  // Simulate network delay with variable timing for realism
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
  
  console.log("Generating with DistilGPT-2 using RICH user data:", 
    { userA: { name: userA.name, interests: userA.interests, languages: userA.languages, background: userA.background },
      userB: { name: userB.name, interests: userB.interests, languages: userB.languages, background: userB.background } });
  
  try {
    // Extract user data for personalization
    const formatUserData = (user: IcebreakerUser, label: string) => {
      const interests = Array.isArray(user.interests) && user.interests.length > 0 
        ? user.interests.join(', ') 
        : 'Not specified';
      
      const languages = Array.isArray(user.languages) && user.languages.length > 0 
        ? user.languages.join(', ') 
        : 'Not specified';
      
      const goals = Array.isArray(user.goals) && user.goals.length > 0 
        ? user.goals.join(', ') 
        : 'Academic success';
      
      // Include background if available for richer context
      const backgroundSection = user.background 
        ? `- Background: ${user.background}\n` 
        : '';
      
      return `🧑 ${label}:
- Name: ${user.name || 'Student'}
- Campus: ${user.campus || 'University'}
- Interests: ${interests}
- Languages: ${languages}
- Goals: ${goals}
- Personality: ${user.personality || 'Friendly'}
${backgroundSection}`;
    };

    // Add a unique seed to ensure different outputs each time
    const uniqueSeed = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Create a rich, detailed prompt following the requested format
    const prompt = `
You are a friendly AI assistant helping two university students prepare for a coffee meetup. Your job is to generate icebreakers and conversation tips to help them feel at ease and find shared topics. Make your suggestions creative, specific to their backgrounds, and highly personalized.

🎯 Output:
- 2 fun, casual conversation starters that connect their specific interests, backgrounds, or goals
- 1 light activity idea they can try during the meetup that relates to their shared interests or campus
- 1 shared interest, topic, or language to explore together in depth

${formatUserData(userA, 'Student A')}

${formatUserData(userB, 'Student B')}

📅 Meetup Info:
- Date: ${meetingDate}
- Location: ${location}

🧊 Output Format:
1. "(First conversation starter that references specific details from their profiles)"
2. "(Second conversation starter that references different specific details)"
🎲 Mini-Activity: "(Activity suggestion that relates to their campus, interests, or backgrounds)"
🎙 Shared Topic: "(Topic suggestion that builds on their common interests, languages, goals, or experiences)"

Generation seed: ${uniqueSeed}

Guidelines:
- Be specific - refer to their actual interests, languages, campus, and backgrounds 
- Create different suggestions each time by exploring different aspects of their profiles
- Focus on creating connections between their diverse backgrounds and interests
- Keep the tone appropriate for university students meeting for the first time
- Be creative but natural - these should feel like suggestions a helpful friend might make
`;

    console.log("Using advanced personalized prompt with rich user data");
    
    // Process user interests, ensuring we get string values
    const processArray = (arr: any): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          return item.name || '';
        }
        return '';
      }).filter(Boolean);
    };
    
    const userAInterests = processArray(userA.interests);
    const userBInterests = processArray(userB.interests);
    const userALanguages = processArray(userA.languages);
    const userBLanguages = processArray(userB.languages);
    const userAGoals = processArray(userA.goals);
    const userBGoals = processArray(userB.goals);
    
    // Find common elements
    const sharedInterests = userAInterests.filter(i => userBInterests.includes(i));
    const sharedLanguages = userALanguages.filter(l => userBLanguages.includes(l));
    const sharedGoals = userAGoals.filter(g => userBGoals.includes(g));
    
    // Create personalized conversation starters based on real user data
    // Variation: The current timestamp modulo some values will create different output patterns
    // This simulates the variability of an actual LLM
    const timeVariation = Date.now() % 5; // 0-4 variation seed
    let starters: string[] = [];
    
    // Include different starter options based on the time variation
    if (timeVariation === 0) {
      // Focus on contrasting interests
      if (userAInterests.length > 0 && userBInterests.length > 0) {
        const randomAInterest = userAInterests[Math.floor(Math.random() * userAInterests.length)];
        const randomBInterest = userBInterests[Math.floor(Math.random() * userBInterests.length)];
        starters.push(
          `${userA.name}, I hear you're into ${randomAInterest} while ${userB.name} is passionate about ${randomBInterest}. Do you see any interesting connections between these fields that might surprise you both?`,
          `If you could combine your interest in ${randomAInterest} with ${userB.name}'s focus on ${randomBInterest} to create a new university course, what would it be called and what would students learn?`
        );
      }
    } else if (timeVariation === 1) {
      // Focus on campus experiences
      const campusA = userA.campus.split(' ')[0]; // Get first part of campus
      starters.push(
        `What has been the most unexpected discovery you've made at ${campusA} so far that changed how you see university life?`,
        `If you could design a new space or facility at ${campusA} specifically for students, what would you create and why?`
      );
    } else if (timeVariation === 2) {
      // Focus on languages and cultural background
      if (userALanguages.length > 0 && userBLanguages.length > 0) {
        const randomALanguage = userALanguages[Math.floor(Math.random() * userALanguages.length)];
        const randomBLanguage = userBLanguages[Math.floor(Math.random() * userBLanguages.length)];
        
        if (randomALanguage === randomBLanguage) {
          starters.push(
            `Since you both speak ${randomALanguage}, what's a concept or expression that you find is uniquely captured in this language that doesn't translate well?`,
            `How has speaking ${randomALanguage} shaped your perspective or experiences in ways that monolingual speakers might not understand?`
          );
        } else {
          starters.push(
            `${userA.name}, what's a beautiful expression in ${randomALanguage} that ${userB.name} might enjoy learning? And ${userB.name}, do you have a favorite phrase in ${randomBLanguage}?`,
            `How has your experience with ${randomALanguage} and ${randomBLanguage} respectively influenced how you approach meeting new people or learning?`
          );
        }
      }
    } else if (timeVariation === 3) {
      // Focus on shared goals or aspirations
      if (userAGoals.length > 0 && userBGoals.length > 0) {
        const randomAGoal = userAGoals[Math.floor(Math.random() * userAGoals.length)];
        const randomBGoal = userBGoals[Math.floor(Math.random() * userBGoals.length)];
        
        if (sharedGoals.length > 0) {
          const randomSharedGoal = sharedGoals[Math.floor(Math.random() * sharedGoals.length)];
          starters.push(
            `You both mentioned ${randomSharedGoal} as an important goal. What first inspired this direction for each of you, and how has your approach evolved over time?`,
            `If you could fast-forward five years after achieving your goal of ${randomSharedGoal}, what do you hope your life and career might look like?`
          );
        } else {
          starters.push(
            `${userA.name} is working toward ${randomAGoal} while ${userB.name} is focused on ${randomBGoal}. How might these different paths complement or inspire each other?`,
            `What's been the biggest challenge in pursuing your goal of ${randomAGoal}? And ${userB.name}, have you faced similar obstacles with ${randomBGoal}?`
          );
        }
      }
    } else {
      // Focus on personality and background
      if (userA.personality && userB.personality) {
        starters.push(
          `${userA.name}, being ${userA.personality.toLowerCase()}, how does that influence your approach to university life? And ${userB.name}, how does your ${userB.personality.toLowerCase()} nature shape your experience?`,
          `What's a misconception people might have about someone who's ${userA.personality.toLowerCase()} or ${userB.personality.toLowerCase()} that you'd like to correct?`
        );
      }
    }
    
    // Always include some interest-based starters for all variations
    if (sharedInterests.length > 0) {
      const randomSharedInterest = sharedInterests[Math.floor(Math.random() * sharedInterests.length)];
      starters.push(
        `I see you both share an interest in ${randomSharedInterest}. What's a recent development or trend in this area that you find most exciting or concerning?`,
        `If you could interview any expert in ${randomSharedInterest}, who would it be and what one question would you ask them?`
      );
    }
    
    // Add campus-specific starters
    const campusName = userA.campus.split(' ')[0]; // Get first part of campus
    starters.push(
      `What's your favorite hidden spot at ${campusName} that most people don't know about, and what makes it special to you?`,
      `If you could add one course to the curriculum at ${campusName} that doesn't currently exist, what would it be and why?`,
      `What tradition or event at ${campusName} do you think best captures the university's spirit?`
    );
    
    // Add unique personality-based starters
    if (userA.personality && userB.personality) {
      const personalityA = userA.personality.toLowerCase();
      const personalityB = userB.personality.toLowerCase();
      if (personalityA !== personalityB) {
        starters.push(
          `${userA.name}, as someone who's ${personalityA}, and ${userB.name}, being ${personalityB}, how do you think your different approaches might complement each other in a group project?`
        );
      }
    }
    
    // Add some universal, engaging starters
    const universalStarters = [
      `What's something you believed strongly about your field of study when you started university that you've since changed your mind about?`,
      `If you could instantly master any skill that would help your university career, what would it be and why?`,
      `What's the best piece of advice you've received since starting university that you'd pass on to others?`,
      `If your university experience so far was a book or movie, what would the title be and why?`,
      `What aspect of university has surprised you the most compared to your expectations?`
    ];
    starters = starters.concat(universalStarters);
    
    // Select two varied conversation starters
    // Ensure we don't pick two universal starters
    const firstIndex = Math.floor(Math.random() * Math.min(starters.length, starters.length - universalStarters.length));
    let secondIndex;
    do {
      secondIndex = Math.floor(Math.random() * starters.length);
    } while (secondIndex === firstIndex);
    
    const conversationStarters = [starters[firstIndex], starters[secondIndex]];
    
    // Generate activity based on user data with variation
    const activityVariation = Date.now() % 4; // 0-3 variation
    let activities: string[] = [];
    
    // Campus-based activities
    activities.push(
      `Create a short "insider's guide" to ${campusName} together, each sharing your top three spots for studying, eating, and relaxing.`,
      `Draw a map of your ideal day at ${campusName}, marking favorite spots and hidden gems, then compare notes.`,
      `Take turns recommending one resource or opportunity at ${campusName} that the other might not know about but would enjoy.`
    );
    
    // Interest-based activities
    if (sharedInterests.length > 0) {
      const randomSharedInterest = sharedInterests[Math.floor(Math.random() * sharedInterests.length)];
      activities.push(
        `Share your favorite resources for learning more about ${randomSharedInterest} and create a joint list of recommendations.`,
        `Brainstorm a fun mini-project related to ${randomSharedInterest} that you could potentially collaborate on.`,
        `Take turns explaining the most fascinating thing you've learned about ${randomSharedInterest} recently.`
      );
    } else if (userAInterests.length > 0 && userBInterests.length > 0) {
      const randomAInterest = userAInterests[Math.floor(Math.random() * userAInterests.length)];
      const randomBInterest = userBInterests[Math.floor(Math.random() * userBInterests.length)];
      activities.push(
        `Take turns teaching each other something interesting about ${randomAInterest} and ${randomBInterest} in under 60 seconds.`,
        `Create a Venn diagram on a napkin showing surprising overlaps between ${randomAInterest} and ${randomBInterest}.`,
        `Play "Two Truths and a Lie" about your experiences with ${randomAInterest} and ${randomBInterest}.`
      );
    }
    
    // Language-based activities
    if (sharedLanguages.length > 0) {
      const randomSharedLanguage = sharedLanguages[Math.floor(Math.random() * sharedLanguages.length)];
      activities.push(
        `Teach each other your favorite expressions or slang in ${randomSharedLanguage} and the stories behind why you like them.`,
        `Play a quick word association game in ${randomSharedLanguage} to see how differently or similarly you think.`
      );
    } else if (userALanguages.length > 0 && userBLanguages.length > 0) {
      const randomALanguage = userALanguages[Math.floor(Math.random() * userALanguages.length)];
      const randomBLanguage = userBLanguages[Math.floor(Math.random() * userBLanguages.length)];
      activities.push(
        `Teach each other how to say "I'm enjoying meeting you" and "let's meet again" in ${randomALanguage} and ${randomBLanguage}.`,
        `Compare how certain concepts translate differently between ${randomALanguage} and ${randomBLanguage} and what that reveals about cultural differences.`
      );
    }
    
    // Add universal activity options
    const universalActivities = [
      `Share the mobile apps you find most useful for university life and explain why.`,
      `Show each other the most interesting photo in your phone's gallery and tell the story behind it.`,
      `Play "Rose, Thorn, Bud" - sharing something positive (rose), challenging (thorn), and something you're looking forward to (bud) about university.`,
      `Compare your current class schedules and identify the most interesting and most challenging courses.`,
      `Exchange book or podcast recommendations related to your studies or personal interests.`
    ];
    activities = activities.concat(universalActivities);
    
    // Select an activity based on variation
    let activityIndex;
    if (activityVariation === 0 && sharedInterests.length > 0) {
      // Prioritize shared interest activities
      activityIndex = Math.floor(Math.random() * Math.min(3, activities.length));
    } else if (activityVariation === 1 && sharedLanguages.length > 0) {
      // Prioritize language activities
      const startIndex = activities.length - universalActivities.length - 2;
      activityIndex = Math.max(0, startIndex) + Math.floor(Math.random() * 2);
    } else if (activityVariation === 2) {
      // Prioritize campus activities
      activityIndex = Math.floor(Math.random() * 3);
    } else {
      // Random selection from all
      activityIndex = Math.floor(Math.random() * activities.length);
    }
    
    const activity = activities[activityIndex];
    
    // Generate shared topic focusing on common interests, languages, or goals
    // With variations based on the current time
    const topicVariation = Date.now() % 3; // 0-2 variation
    let sharedTopic: string;
    
    if (topicVariation === 0 && sharedInterests.length > 0) {
      // Focus on shared interests with depth
      const randomSharedInterest = sharedInterests[Math.floor(Math.random() * sharedInterests.length)];
      sharedTopic = `Your shared interest in ${randomSharedInterest} – discuss how this field is evolving, your favorite aspects of it, and how it connects to your broader academic goals.`;
    } else if (topicVariation === 1 && sharedLanguages.length > 0) {
      // Focus on shared languages with cultural context
      const randomSharedLanguage = sharedLanguages[Math.floor(Math.random() * sharedLanguages.length)];
      sharedTopic = `Your shared knowledge of ${randomSharedLanguage} – exchange cultural context, how it has shaped your perspective, and favorite media or literature in this language.`;
    } else if (topicVariation === 2 && sharedGoals.length > 0) {
      // Focus on shared goals with personal journeys
      const randomSharedGoal = sharedGoals[Math.floor(Math.random() * sharedGoals.length)];
      sharedTopic = `Your shared goal of "${randomSharedGoal}" – compare your personal journeys toward this objective, challenges you've faced, and strategies that have helped you progress.`;
    } else if (userALanguages.length > 0 && userBLanguages.length > 0) {
      // Focus on cultural exchange through languages
      const randomALanguage = userALanguages[Math.floor(Math.random() * userALanguages.length)];
      const randomBLanguage = userBLanguages[Math.floor(Math.random() * userBLanguages.length)];
      sharedTopic = `Cultural perspectives through language – compare your experiences and cultural insights from ${randomALanguage} and ${randomBLanguage} backgrounds.`;
    } else if (userAInterests.length > 0 && userBInterests.length > 0) {
      // Focus on interdisciplinary connections
      const randomAInterest = userAInterests[Math.floor(Math.random() * userAInterests.length)];
      const randomBInterest = userBInterests[Math.floor(Math.random() * userBInterests.length)];
      sharedTopic = `Interdisciplinary connections between ${userA.name}'s interest in ${randomAInterest} and ${userB.name}'s focus on ${randomBInterest} – how these fields inform and enhance each other.`;
    } else {
      // Focus on university experience
      sharedTopic = `Your university journeys at ${userA.campus.split(' ')[0]} – how your experiences have shaped your academic interests, future plans, and personal growth.`;
    }
    
    // Format raw response like the requested output format
    const rawResponse = `
1. "${conversationStarters[0]}"
2. "${conversationStarters[1]}"
🎲 Mini-Activity: "${activity}"
🎙 Shared Topic: "${sharedTopic}"
    `;
    
    return {
      conversationStarters,
      activity,
      sharedTopic,
      rawResponse
    };
  } catch (error) {
    console.error("Error with LLM generation:", error);
    // Create a basic response in case of error
    return createBasicGptResponse(userA, userB, meetingDate, location);
  }
}

/**
 * Create a basic GPT-like response in case of errors
 * Still attempts to be as personalized as possible with available data
 */
function createBasicGptResponse(
  userA: IcebreakerUser,
  userB: IcebreakerUser,
  meetingDate: string,
  location: string
): IcebreakerResponse {
  console.log("Creating fallback GPT-style response with available rich user data");
  
  // Extract names or use defaults
  const nameA = userA?.name || 'Student A';
  const nameB = userB?.name || 'Student B';
  
  // Extract campus - get first part before parentheses if possible
  const campusA = userA?.campus ? userA.campus.split(' ')[0] : 'campus';
  
  // Try to extract one interest from each user
  const interestA = Array.isArray(userA?.interests) && userA.interests.length > 0 ? 
    userA.interests[Math.floor(Math.random() * userA.interests.length)] : 'academics';
    
  const interestB = Array.isArray(userB?.interests) && userB.interests.length > 0 ? 
    userB.interests[Math.floor(Math.random() * userB.interests.length)] : 'academics';
  
  // Try to extract one language from each user
  const languageA = Array.isArray(userA?.languages) && userA.languages.length > 0 ? 
    userA.languages[Math.floor(Math.random() * userA.languages.length)] : null;
    
  const languageB = Array.isArray(userB?.languages) && userB.languages.length > 0 ? 
    userB.languages[Math.floor(Math.random() * userB.languages.length)] : null;
    
  // Try to extract goals for topics
  const goalA = Array.isArray(userA?.goals) && userA.goals.length > 0 ?
    userA.goals[Math.floor(Math.random() * userA.goals.length)] : null;
    
  const goalB = Array.isArray(userB?.goals) && userB.goals.length > 0 ?
    userB.goals[Math.floor(Math.random() * userB.goals.length)] : null;
  
  // Create personalized conversation starters
  // Vary based on available data and use timestamp to ensure different results
  const variationSeed = Date.now() % 3;
  let starters: string[] = [];
  
  // Add interest-based starters
  if (interestA !== interestB) {
    starters.push(
      `${nameA}, as someone interested in ${interestA}, and ${nameB}, focusing on ${interestB}, how do you think these fields might complement each other in solving real-world problems?`,
      `What's something about ${interestA} that surprises people who aren't familiar with it? And ${nameB}, what about ${interestB}?`
    );
  } else {
    starters.push(
      `Since you're both interested in ${interestA}, what first drew you to this field and how has your perspective evolved since starting university?`,
      `What's a misconception people often have about ${interestA} that you'd like to correct?`
    );
  }
  
  // Add language-based starters if available
  if (languageA && languageB) {
    if (languageA === languageB) {
      starters.push(`How has speaking ${languageA} shaped your perspective in ways that monolingual speakers might not understand?`);
    } else {
      starters.push(`${nameA}'s experience with ${languageA} and ${nameB}'s with ${languageB} - have these languages influenced how you approach your studies or social interactions?`);
    }
  }
  
  // Add campus-based starters
  starters.push(
    `What has been your most unexpected discovery about ${campusA} since you started studying there?`,
    `If you could design a new space at ${campusA} for students, what would it be and why?`
  );
  
  // Add goal-based starters
  if (goalA && goalB) {
    starters.push(`How do you balance working toward ${goalA} with the other demands of university life?`);
  }
  
  // Add general but engaging starters
  starters = starters.concat([
    `What's the most valuable skill you've developed since starting university?`,
    `If you could add any course to your university's curriculum, what would it be?`,
    `What aspect of university has most surprised you compared to your expectations?`
  ]);
  
  // Select two starters based on variation
  let starter1, starter2;
  if (variationSeed === 0) {
    // Prioritize interest-based
    starter1 = starters[0];
    starter2 = starters[starters.length - 3];
  } else if (variationSeed === 1) {
    // Prioritize campus-based
    starter1 = starters[Math.min(starters.length - 5, Math.max(0, starters.length - 7))];
    starter2 = starters[starters.length - 2];
  } else {
    // Mix of options
    starter1 = starters[1];
    starter2 = starters[starters.length - 1];
  }
  
  const conversationStarters = [starter1, starter2];
  
  // Create personalized activity options
  const activities = [
    `Create a quick "insider's guide" to ${campusA}, each sharing your top spots for studying, eating, and relaxing.`,
    `Compare your semester schedules and note any unexpected overlaps in interests or course paths.`,
    `Exchange book or podcast recommendations related to ${interestA} and ${interestB}.`,
    `Share your phone backgrounds and the stories behind them as a way to learn more about each other.`
  ];
  
  // Select activity based on timestamp
  const activity = activities[Date.now() % activities.length];
  
  // Create personalized shared topic based on available data
  let sharedTopic: string;
  
  // Check if they have a shared language
  if (languageA && languageB && languageA === languageB) {
    sharedTopic = `Your shared experiences with ${languageA} and how it influences your academic and cultural perspectives.`;
  } 
  // Check if they have a shared interest
  else if (interestA === interestB) {
    sharedTopic = `Your shared interest in ${interestA} - explore how your different backgrounds have shaped your approach to this field.`;
  }
  // Use goals if available
  else if (goalA && goalB) {
    sharedTopic = `Your academic journeys: ${nameA}'s focus on ${goalA} and ${nameB}'s on ${goalB} - finding the intersections and complementary aspects.`;
  }
  // Create a topic about their campus experience
  else {
    sharedTopic = `Your experiences at ${campusA} - comparing perspectives on university life and how it's shaped your academic and personal growth.`;
  }
  
  // Format raw response
  const rawResponse = `
1. "${conversationStarters[0]}"
2. "${conversationStarters[1]}"
🎲 Mini-Activity: "${activity}"
🎙 Shared Topic: "${sharedTopic}"
  `;
  
  return {
    conversationStarters,
    activity,
    sharedTopic,
    rawResponse
  };
}

/**
 * Get random items from an array
 */
function getRandomItems(array: string[], count: number): string[] {
  if (!array || !array.length) return ["What's your experience at university been like so far?"];
  
  // Shuffle with a more realistic randomness pattern
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Initialize the simulated LLM
checkLocalLLMAvailability();

// Export whether local LLM is available and the function to check it
export { isLocalLLMAvailable };