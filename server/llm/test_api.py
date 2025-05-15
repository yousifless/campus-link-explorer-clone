#!/usr/bin/env python3
"""
Test script for the local DistilGPT-2 icebreaker generator API
Run with: python test_api.py
"""

import json
import requests
import sys

API_URL = 'http://localhost:5000/api/icebreakers'

# Test data
test_data = {
    "userA": {
        "name": "Test User A",
        "campus": "Test Campus",
        "interests": ["AI", "Music", "Programming"],
        "languages": ["English", "Spanish"],
        "goals": ["Learning", "Networking"],
        "personality": "Friendly and outgoing"
    },
    "userB": {
        "name": "Test User B",
        "campus": "Test Campus",
        "interests": ["AI", "Photography", "Sports"],
        "languages": ["English", "French"],
        "goals": ["Career growth", "Making friends"],
        "personality": "Curious and analytical"
    },
    "meetingDate": "Tomorrow",
    "location": "Campus Coffee Shop"
}

def test_api():
    """Test the local DistilGPT-2 API"""
    print("Testing local DistilGPT-2 API...")
    print("Checking if API is available...")
    
    try:
        # First check with a HEAD request if the server is running
        health_check = requests.head(API_URL, timeout=5)
        if health_check.status_code == 200:
            print("✅ API is available")
        else:
            print(f"❌ API returned status: {health_check.status_code}")
            return
        
        print("\nSending icebreaker generation request...")
        print("This may take a few seconds for the first request as the model loads...")
        
        response = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json=test_data,
            timeout=60  # Longer timeout for model loading
        )
        
        if response.status_code != 200:
            print(f"❌ API error: {response.status_code}")
            print("Error details:", response.text)
            return
        
        data = response.json()
        
        print("\n✅ Successfully generated icebreakers!")
        print("\nConversation Starters:")
        for i, starter in enumerate(data["conversationStarters"]):
            print(f'{i+1}. "{starter}"')
        
        print(f'\nActivity: "{data["activity"]}"')
        print(f'Shared Topic: "{data["sharedTopic"]}"')
        
        print("\nAPI integration is working correctly!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error connecting to API: Connection refused")
        print("Please make sure the server is running with: python transformers_generator.py --serve")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Please make sure the server is running with: python transformers_generator.py --serve")

if __name__ == "__main__":
    test_api() 