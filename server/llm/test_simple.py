#!/usr/bin/env python3
"""
Simple test script for the DistilGPT-2 API using only standard library
"""

import urllib.request
import json
import sys

API_URL = 'http://localhost:8000/api/icebreakers'

# Test data
test_data = {
    "userA": {
        "name": "Test User A",
        "campus": "Test Campus",
        "interests": ["AI", "Programming"],
        "languages": ["English"],
        "goals": ["Learning"],
        "personality": "Friendly"
    },
    "userB": {
        "name": "Test User B",
        "campus": "Test Campus",
        "interests": ["AI", "Photography"],
        "languages": ["English"],
        "goals": ["Networking"],
        "personality": "Curious"
    },
    "meetingDate": "Tomorrow",
    "location": "Campus Coffee Shop"
}

def test_api():
    """Test the API connection using urllib"""
    print(f"Testing API at: {API_URL}")
    
    try:
        # Prepare request
        data = json.dumps(test_data).encode('utf-8')
        headers = {
            'Content-Type': 'application/json',
        }
        req = urllib.request.Request(
            API_URL,
            data=data,
            headers=headers,
            method='POST'
        )
        
        # Send request
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.getcode() != 200:
                print(f"❌ Server returned status code: {response.getcode()}")
                return False
                
            # Read and parse response
            response_data = json.loads(response.read().decode('utf-8'))
            
            # Print results
            print("\n✅ Successfully received response:")
            print("\nConversation starters:")
            for i, starter in enumerate(response_data["conversationStarters"], 1):
                print(f"{i}. \"{starter}\"")
            
            print(f"\nActivity: \"{response_data['activity']}\"")
            print(f"Shared topic: \"{response_data['sharedTopic']}\"")
            
            print("\nAPI is working correctly! ✅")
            return True
            
    except urllib.error.URLError as e:
        print(f"❌ Connection error: {e.reason}")
        print("Please make sure the server is running.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    if not success:
        sys.exit(1) 