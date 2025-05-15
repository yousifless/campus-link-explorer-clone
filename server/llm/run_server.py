#!/usr/bin/env python3
"""
Simple Flask server for DistilGPT-2 icebreaker generation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random

app = Flask(__name__)
CORS(app)

# Server configuration
PORT = 8000

# Simple conversation starter templates
STARTERS = [
    "What's your favorite part about {campus}?",
    "If you could start any club on campus, what would it be?",
    "What class has surprised you the most so far?",
    "What's one skill you hope to develop this year?",
    "How did you choose your major or field of study?",
    "What's the best advice you've received about college life?",
    "What's something you wish you knew before starting college?",
    "If you could have dinner with any professor, who would it be?",
    "What's been your favorite spot to study or hang out on campus?",
    "What are you most looking forward to this semester?"
]

# Activity templates
ACTIVITIES = [
    "Compare your favorite study spots on campus.",
    "Share your favorite places to eat near campus.",
    "Exchange book or podcast recommendations.",
    "Show each other photos of your favorite campus locations.",
    "Plan to attend an upcoming campus event together.",
    "Take a selfie to commemorate your meetup!"
]

# Shared topic templates
TOPICS = [
    "Your academic interests and future career aspirations.",
    "Campus activities and student organizations you're interested in.",
    "Your favorite classes and professors.",
    "Places you'd like to travel or study abroad.",
    "Your favorite hobbies and how you pursue them on campus."
]

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model": "DistilGPT-2 (simulated)"})

@app.route('/api/icebreakers', methods=['POST', 'HEAD'])
def generate_icebreakers():
    # Handle HEAD request for availability checks
    if request.method == 'HEAD':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_a = data.get('userA', {})
        user_b = data.get('userB', {})
        location = data.get('location', 'campus')
        
        # Extract interests to personalize responses
        interests_a = user_a.get('interests', [])
        interests_b = user_b.get('interests', [])
        campus = user_a.get('campus', 'campus')
        
        # Find common interests
        common_interests = []
        if interests_a and interests_b:
            common_interests = [i.lower() for i in interests_a if i.lower() in [j.lower() for j in interests_b]]
        
        # Select and personalize conversation starters
        starters = random.sample(STARTERS, 2)
        starters = [s.format(campus=campus) for s in starters]
        
        # Select activity
        activity = random.choice(ACTIVITIES)
        
        # Select or create shared topic
        if common_interests:
            shared_topic = f"You both share an interest in {common_interests[0]}. Discuss what aspects you enjoy most!"
        else:
            shared_topic = random.choice(TOPICS)
        
        # Format response like the LLM would
        raw_response = f"""
1. "{starters[0]}"
2. "{starters[1]}"
🎲 Mini-Activity: "{activity}"
🎙 Shared Topic: "{shared_topic}"
"""
        
        # Return response
        return jsonify({
            "conversationStarters": starters,
            "activity": activity,
            "sharedTopic": shared_topic,
            "rawResponse": raw_response
        })
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print(f"Starting simple LLM simulation server on port {PORT}...")
    print("This server simulates DistilGPT-2 responses for testing")
    print(f"API endpoint: http://localhost:{PORT}/api/icebreakers")
    app.run(host='0.0.0.0', port=PORT, debug=True) 