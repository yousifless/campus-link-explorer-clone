export interface Interest {
  id: string;
  name: string;
  category: string;
  icon: string;
}

export interface InterestCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  interests: Interest[];
}

export const interestCategories: InterestCategory[] = [
  {
    id: 'arts-crafts',
    name: 'Arts & Crafts',
    description: 'Creative expression through various artistic mediums',
    icon: '🎨',
    interests: [
      { id: 'painting', name: 'Painting', category: 'arts-crafts', icon: '🖌️' },
      { id: 'drawing', name: 'Drawing', category: 'arts-crafts', icon: '✏️' },
      { id: 'sculpting', name: 'Sculpting', category: 'arts-crafts', icon: '🗿' },
      { id: 'knitting', name: 'Knitting', category: 'arts-crafts', icon: '🧶' },
      { id: 'pottery', name: 'Pottery', category: 'arts-crafts', icon: '🏺' },
      { id: 'photography', name: 'Photography', category: 'arts-crafts', icon: '📸' },
    ],
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Musical expression and appreciation',
    icon: '🎵',
    interests: [
      { id: 'playing-instruments', name: 'Playing Instruments', category: 'music', icon: '🎸' },
      { id: 'singing', name: 'Singing', category: 'music', icon: '🎤' },
      { id: 'music-production', name: 'Music Production', category: 'music', icon: '🎹' },
      { id: 'concerts', name: 'Concerts', category: 'music', icon: '🎪' },
      { id: 'music-festivals', name: 'Music Festivals', category: 'music', icon: '🎆' },
    ],
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    description: 'Physical activities and sports',
    icon: '⚽',
    interests: [
      { id: 'running', name: 'Running', category: 'sports-fitness', icon: '🏃' },
      { id: 'yoga', name: 'Yoga', category: 'sports-fitness', icon: '🧘' },
      { id: 'gym-workouts', name: 'Gym Workouts', category: 'sports-fitness', icon: '💪' },
      { id: 'team-sports', name: 'Team Sports', category: 'sports-fitness', icon: '🏀' },
      { id: 'martial-arts', name: 'Martial Arts', category: 'sports-fitness', icon: '🥋' },
      { id: 'hiking', name: 'Hiking', category: 'sports-fitness', icon: '🥾' },
    ],
  },
  {
    id: 'tech-gaming',
    name: 'Technology & Gaming',
    description: 'Digital technology and gaming',
    icon: '🎮',
    interests: [
      { id: 'video-games', name: 'Video Games', category: 'tech-gaming', icon: '🎲' },
      { id: 'coding', name: 'Coding/Programming', category: 'tech-gaming', icon: '💻' },
      { id: 'gadgets', name: 'Gadgets', category: 'tech-gaming', icon: '📱' },
      { id: 'virtual-reality', name: 'Virtual Reality', category: 'tech-gaming', icon: '🥽' },
      { id: 'robotics', name: 'Robotics', category: 'tech-gaming', icon: '🤖' },
    ],
  },
  {
    id: 'food-drink',
    name: 'Food & Drink',
    description: 'Culinary arts and beverage appreciation',
    icon: '🍳',
    interests: [
      { id: 'cooking', name: 'Cooking', category: 'food-drink', icon: '👨‍🍳' },
      { id: 'baking', name: 'Baking', category: 'food-drink', icon: '🥖' },
      { id: 'wine-tasting', name: 'Wine Tasting', category: 'food-drink', icon: '🍷' },
      { id: 'coffee-culture', name: 'Coffee Culture', category: 'food-drink', icon: '☕' },
      { id: 'food-blogging', name: 'Food Blogging', category: 'food-drink', icon: '📝' },
    ],
  },
  {
    id: 'travel-adventure',
    name: 'Travel & Adventure',
    description: 'Exploration and adventure activities',
    icon: '✈️',
    interests: [
      { id: 'backpacking', name: 'Backpacking', category: 'travel-adventure', icon: '🎒' },
      { id: 'road-trips', name: 'Road Trips', category: 'travel-adventure', icon: '🚗' },
      { id: 'cultural-tours', name: 'Cultural Tours', category: 'travel-adventure', icon: '🏛️' },
      { id: 'adventure-sports', name: 'Adventure Sports', category: 'travel-adventure', icon: '🏂' },
      { id: 'cruises', name: 'Cruises', category: 'travel-adventure', icon: '🚢' },
    ],
  },
  {
    id: 'literature-writing',
    name: 'Literature & Writing',
    description: 'Reading and writing activities',
    icon: '📚',
    interests: [
      { id: 'reading', name: 'Reading', category: 'literature-writing', icon: '📖' },
      { id: 'creative-writing', name: 'Creative Writing', category: 'literature-writing', icon: '✍️' },
      { id: 'poetry', name: 'Poetry', category: 'literature-writing', icon: '📝' },
      { id: 'book-clubs', name: 'Book Clubs', category: 'literature-writing', icon: '👥' },
      { id: 'blogging', name: 'Blogging', category: 'literature-writing', icon: '💻' },
    ],
  },
  {
    id: 'science-education',
    name: 'Science & Education',
    description: 'Scientific exploration and learning',
    icon: '🔬',
    interests: [
      { id: 'astronomy', name: 'Astronomy', category: 'science-education', icon: '🔭' },
      { id: 'biology', name: 'Biology', category: 'science-education', icon: '🧬' },
      { id: 'physics', name: 'Physics', category: 'science-education', icon: '⚛️' },
      { id: 'online-courses', name: 'Online Courses', category: 'science-education', icon: '📱' },
      { id: 'science-experiments', name: 'Science Experiments', category: 'science-education', icon: '🧪' },
    ],
  },
  {
    id: 'nature-outdoors',
    name: 'Nature & Outdoors',
    description: 'Outdoor activities and nature appreciation',
    icon: '🌿',
    interests: [
      { id: 'gardening', name: 'Gardening', category: 'nature-outdoors', icon: '🌱' },
      { id: 'bird-watching', name: 'Bird Watching', category: 'nature-outdoors', icon: '🐦' },
      { id: 'camping', name: 'Camping', category: 'nature-outdoors', icon: '⛺' },
      { id: 'environmental-conservation', name: 'Environmental Conservation', category: 'nature-outdoors', icon: '🌍' },
    ],
  },
  {
    id: 'fashion-beauty',
    name: 'Fashion & Beauty',
    description: 'Fashion and beauty related activities',
    icon: '👗',
    interests: [
      { id: 'fashion-design', name: 'Fashion Design', category: 'fashion-beauty', icon: '✂️' },
      { id: 'makeup-artistry', name: 'Makeup Artistry', category: 'fashion-beauty', icon: '💄' },
      { id: 'personal-styling', name: 'Personal Styling', category: 'fashion-beauty', icon: '👔' },
      { id: 'skincare', name: 'Skincare', category: 'fashion-beauty', icon: '🧴' },
    ],
  },
  {
    id: 'movies-tv',
    name: 'Movies & TV',
    description: 'Film and television entertainment',
    icon: '🎬',
    interests: [
      { id: 'film-critique', name: 'Film Critique', category: 'movies-tv', icon: '🎥' },
      { id: 'tv-series', name: 'TV Series', category: 'movies-tv', icon: '📺' },
      { id: 'documentaries', name: 'Documentaries', category: 'movies-tv', icon: '🎞️' },
      { id: 'animation', name: 'Animation', category: 'movies-tv', icon: '🎨' },
    ],
  },
  {
    id: 'social-community',
    name: 'Social & Community',
    description: 'Community engagement and social activities',
    icon: '🤝',
    interests: [
      { id: 'volunteering', name: 'Volunteering', category: 'social-community', icon: '❤️' },
      { id: 'activism', name: 'Activism', category: 'social-community', icon: '✊' },
      { id: 'networking', name: 'Networking', category: 'social-community', icon: '🤝' },
      { id: 'public-speaking', name: 'Public Speaking', category: 'social-community', icon: '🎤' },
    ],
  },
  {
    id: 'mindfulness-wellbeing',
    name: 'Mindfulness & Well-being',
    description: 'Mental health and wellness activities',
    icon: '🧘',
    interests: [
      { id: 'meditation', name: 'Meditation', category: 'mindfulness-wellbeing', icon: '🧘‍♀️' },
      { id: 'mindfulness', name: 'Mindfulness', category: 'mindfulness-wellbeing', icon: '🧠' },
      { id: 'self-care', name: 'Self-care', category: 'mindfulness-wellbeing', icon: '💆' },
      { id: 'mental-health-awareness', name: 'Mental Health Awareness', category: 'mindfulness-wellbeing', icon: '💭' },
    ],
  },
  {
    id: 'history-culture',
    name: 'History & Culture',
    description: 'Historical and cultural exploration',
    icon: '🏛️',
    interests: [
      { id: 'historical-research', name: 'Historical Research', category: 'history-culture', icon: '📜' },
      { id: 'museums', name: 'Museums', category: 'history-culture', icon: '🏛️' },
      { id: 'cultural-festivals', name: 'Cultural Festivals', category: 'history-culture', icon: '🎪' },
      { id: 'genealogy', name: 'Genealogy', category: 'history-culture', icon: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    id: 'business-finance',
    name: 'Business & Finance',
    description: 'Business and financial activities',
    icon: '💼',
    interests: [
      { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'business-finance', icon: '🚀' },
      { id: 'investing', name: 'Investing', category: 'business-finance', icon: '📈' },
      { id: 'personal-finance', name: 'Personal Finance', category: 'business-finance', icon: '💰' },
      { id: 'startups', name: 'Startups', category: 'business-finance', icon: '💡' },
    ],
  },
  {
    id: 'pets-animals',
    name: 'Pets & Animals',
    description: 'Animal care and conservation',
    icon: '🐾',
    interests: [
      { id: 'pet-care', name: 'Pet Care', category: 'pets-animals', icon: '🐕' },
      { id: 'animal-rescue', name: 'Animal Rescue', category: 'pets-animals', icon: '🏥' },
      { id: 'wildlife-conservation', name: 'Wildlife Conservation', category: 'pets-animals', icon: '��' },
    ],
  },
]; 