// Simple script to test the DistilGPT-2 API connection
// Run with: node test.js

const url = 'http://localhost:5000/api/icebreakers';

const testData = {
  userA: {
    name: "Test User A",
    campus: "Test Campus",
    interests: ["AI", "Programming"],
    languages: ["English"],
    goals: ["Learning"],
    personality: "Friendly"
  },
  userB: {
    name: "Test User B",
    campus: "Test Campus",
    interests: ["AI", "Photography"],
    languages: ["English"],
    goals: ["Networking"],
    personality: "Curious"
  },
  meetingDate: "Tomorrow",
  location: "Campus Coffee Shop"
};

async function testApi() {
  try {
    console.log("Testing API at:", url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Successfully received response:");
    console.log("Conversation starters:", data.conversationStarters);
    console.log("Activity:", data.activity);
    console.log("Shared topic:", data.sharedTopic);
    console.log("\nAPI is working correctly! ✅");
  } catch (error) {
    console.error("Error testing API:", error.message);
    process.exit(1);
  }
}

// Need to use import for fetch in Node.js
import('node-fetch').then(({default: fetch}) => {
  testApi();
}).catch(err => {
  console.error("Error importing node-fetch:", err.message);
  console.error("Run 'npm install node-fetch' to install it.");
}); 