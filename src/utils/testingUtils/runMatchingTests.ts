
import { 
  generateSyntheticProfiles, 
  createTestUsers, 
  simulateMatching,
  runABTest
} from './matchingAlgorithmTest';

// Function to run all matching algorithm tests
export const runMatchingTests = async () => {
  console.log('Running matching algorithm tests...');
  
  // Step 1: Generate synthetic profiles
  const syntheticProfiles = generateSyntheticProfiles(20);
  console.log(`Generated ${syntheticProfiles.length} synthetic profiles`);
  
  // Step 2: Simulate matching with the profiles
  const matches = simulateMatching(syntheticProfiles);
  console.log(`Generated ${matches.length} potential matches`);
  console.log('Top 5 matches:');
  matches.slice(0, 5).forEach((match, index) => {
    console.log(`${index + 1}. ${match.user1.first_name} ${match.user1.last_name} and ${match.user2.first_name} ${match.user2.last_name}: Score ${match.score}`);
    console.log(`   Shared interests: ${match.user1.interests.filter(i => match.user2.interests.includes(i)).join(', ')}`);
    console.log(`   Shared languages: ${match.user1.languages.filter(l => match.user2.languages.includes(l)).join(', ')}`);
    console.log(`   Universities: ${match.user1.university} and ${match.user2.university}`);
    console.log(`   Student types: ${match.user1.student_type} and ${match.user2.student_type}`);
  });
  
  // Step 3: Run A/B test
  const abTestResults = runABTest(syntheticProfiles);
  console.log('\nA/B Test Results:');
  console.log(`Algorithm A (prioritizes interests/languages) top match score: ${abTestResults.algorithmA[0].score}`);
  console.log(`Algorithm B (prioritizes student type/university) top match score: ${abTestResults.algorithmB[0].score}`);
  
  const overlapInTop10 = abTestResults.algorithmA.slice(0, 10).filter(matchA => 
    abTestResults.algorithmB.slice(0, 10).some(matchB => 
      (matchA.pair[0] === matchB.pair[0] && matchA.pair[1] === matchB.pair[1]) ||
      (matchA.pair[0] === matchB.pair[1] && matchA.pair[1] === matchB.pair[0])
    )
  ).length;
  
  console.log(`Overlap in top 10 matches between algorithms: ${overlapInTop10} matches`);
  
  // The function below is commented out because it should only be used in development with caution
  // as it creates actual test users in the database
  /*
  // Create test users in the database (use with caution)
  const testUserCount = 5; // Limit to a small number for testing
  const testProfiles = generateSyntheticProfiles(testUserCount);
  const created = await createTestUsers(testProfiles);
  if (created) {
    console.log(`Successfully created ${testUserCount} test users in the database`);
  } else {
    console.log('Failed to create test users');
  }
  */
  
  console.log('Finished running matching algorithm tests');
};

// Export a function to only run specific tests
export const runMatchSimulation = () => {
  const profiles = generateSyntheticProfiles(10);
  return simulateMatching(profiles);
};
