import urllib.request
import json

# API URL
url = "http://localhost:8000/api/icebreakers"

# Test data
data = {
    "userA": {"name": "Test User A"},
    "userB": {"name": "Test User B"}
}

# Convert data to JSON
json_data = json.dumps(data).encode('utf-8')

# Make request
try:
    # First check if server is up
    print(f"Testing server at {url}...")
    
    # Create request with headers
    req = urllib.request.Request(
        url, 
        data=json_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    # Send request and get response
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        
        # Print response
        print("\nServer responded successfully!")
        print("\nGenerated icebreakers:")
        for i, starter in enumerate(result["conversationStarters"]):
            print(f"{i+1}. {starter}")
        
        print(f"\nActivity: {result['activity']}")
        print(f"Shared Topic: {result['sharedTopic']}")
        
        print("\nTest successful! ✅")
        
except Exception as e:
    print(f"Error: {e}") 