/**
 * Test script for the local DistilGPT-2 icebreaker generator API
 * Run with: node test_api.js
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api/icebreakers';

// Test data
const testData = {
  userA: {
    name: "Test User A",
    campus: "Test Campus",
    interests: ["AI", "Music", "Programming"],
    languages: ["English", "Spanish"],
    goals: ["Learning", "Networking"],
    personality: "Friendly and outgoing"
  },
  userB: {
    name: "Test User B",
    campus: "Test Campus",
    interests: ["AI", "Photography", "Sports"],
    languages: ["English", "French"],
    goals: ["Career growth", "Making friends"],
    personality: "Curious and analytical"
  },
  meetingDate: "Tomorrow",
  location: "Campus Coffee Shop"
};

async function testApi() {
  console.log("Testing local DistilGPT-2 API...");
  console.log("Checking if API is available...");
  
  try {
    // First check with a HEAD request if the server is running
    const healthCheck = await fetch(API_URL, { method: 'HEAD' });
    if (healthCheck.ok) {
      console.log("✅ API is available");
    } else {
      console.error("❌ API returned status:", healthCheck.status);
      return;
    }
    
    console.log("\nSending icebreaker generation request...");
    console.log("This may take a few seconds for the first request as the model loads...");
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      console.error(`❌ API error: ${response.status}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log("\n✅ Successfully generated icebreakers!");
    console.log("\nConversation Starters:");
    data.conversationStarters.forEach((starter, i) => {
      console.log(`${i+1}. "${starter}"`);
    });
    
    console.log(`\nActivity: "${data.activity}"`);
    console.log(`Shared Topic: "${data.sharedTopic}"`);
    
    console.log("\nAPI integration is working correctly!");
    
  } catch (error) {
    console.error("❌ Error connecting to API:", error.message);
    console.error("Please make sure the server is running with: python transformers_generator.py --serve");
  }
}

testApi(); 