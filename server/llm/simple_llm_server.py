from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# Server port
PORT = 8000

# List of conversation starters
starters = [
    "What's your favorite part about campus life?",
    "If you could start any club on campus, what would it be?",
    "What class has surprised you the most so far?",
    "What's one skill you hope to develop this year?",
    "How did you choose your major?",
    "What's the best advice you've received about college?",
    "What's something you wish you knew before starting college?",
    "What's been your favorite spot to study on campus?",
    "What are you most looking forward to this semester?",
    "What's one thing you want to accomplish before graduating?"
]

# List of activities
activities = [
    "Compare your favorite study spots on campus.",
    "Share your favorite places to eat near campus.",
    "Exchange book or podcast recommendations.",
    "Show each other photos of your favorite places on campus.",
    "Take a selfie to commemorate your meetup!"
]

# List of shared topics
topics = [
    "Your academic interests and future career aspirations.",
    "Campus activities and student organizations.",
    "Your favorite classes and professors.",
    "Places you'd like to travel or study abroad.",
    "Your hobbies and how you pursue them on campus."
]

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": "DistilGPT-2 (simulated)"})

@app.route('/api/icebreakers', methods=['POST', 'HEAD'])
def icebreakers():
    # Handle HEAD requests for availability checks
    if request.method == 'HEAD':
        return '', 200
    
    # Handle POST requests for generating icebreakers
    try:
        # Get data from request
        data = request.json
        
        # Generate response
        selected_starters = random.sample(starters, 2)
        selected_activity = random.choice(activities)
        selected_topic = random.choice(topics)
        
        # Format the raw response
        raw_response = f"""
1. "{selected_starters[0]}"
2. "{selected_starters[1]}"
🎲 Mini-Activity: "{selected_activity}"
🎙 Shared Topic: "{selected_topic}"
"""
        
        # Return the response
        return jsonify({
            "conversationStarters": selected_starters,
            "activity": selected_activity,
            "sharedTopic": selected_topic,
            "rawResponse": raw_response
        })
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print(f"Starting simple LLM server on port {PORT}")
    print(f"Test URL: http://localhost:{PORT}/api/icebreakers")
    app.run(host='0.0.0.0', port=PORT) 