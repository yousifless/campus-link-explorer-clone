// Collection of icebreaker questions for new conversations
export const iceBreakers = [
  "What's your favorite spot on campus?",
  "Which class are you enjoying the most this semester?",
  "Have you joined any clubs besides this one?",
  "What made you choose your major?",
  "Any recommendations for good coffee spots near campus?",
  "What's your go-to study spot?",
  "Have you attended any campus events recently?",
  "What's something you wish you knew before starting college?",
  "Any fun weekend plans coming up?",
  "What's the best dining hall on campus in your opinion?",
  "Are you taking any interesting electives this semester?",
  "What's your favorite way to de-stress during exam weeks?",
  "Have you discovered any hidden gems around campus?",
  "What student resources have you found most helpful?",
  "Do you have any favorite traditions on campus?",
  "What's been the highlight of your semester so far?",
  "Any TV shows you're currently watching?",
  "What's the best advice you've received in college?",
  "How do you usually spend your breaks between classes?",
  "What do you hope to learn or achieve through this connection?"
];

// Get a random set of unique icebreakers
export const getRandomIceBreakers = (count = 3): string[] => {
  const shuffled = [...iceBreakers].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}; 