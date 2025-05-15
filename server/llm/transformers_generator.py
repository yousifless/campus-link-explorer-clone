#!/usr/bin/env python3
"""
Transformers-based Icebreaker Generator

This script demonstrates how to use Hugging Face Transformers to generate
icebreakers for student meetups.

Requirements:
- transformers
- torch
- flask (for API service)
- flask-cors (for cross-origin requests)

Usage:
- As a standalone script: python transformers_generator.py
- As an API server: python transformers_generator.py --serve
"""

import argparse
import json
import re
import sys
import os
import logging
from typing import Dict, List, Any
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("icebreaker-generator")

# Check Python version
python_version = sys.version_info
logger.info(f"Running with Python {python_version.major}.{python_version.minor}.{python_version.micro}")

try:
    import torch
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    TRANSFORMERS_AVAILABLE = True
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        logger.info(f"CUDA device: {torch.cuda.get_device_name(0)}")
except ImportError as e:
    TRANSFORMERS_AVAILABLE = False
    logger.error(f"Failed to import required libraries: {e}")
    logger.warning("Install with: pip install transformers torch flask flask-cors")

# Using DistilGPT-2 as the default model - lightweight and efficient for local use
DEFAULT_MODEL = "distilgpt2"  # Approximately 82 million parameters

class IcebreakerGenerator:
    """Generate icebreakers using transformers models"""
    
    def __init__(self, model_name: str = DEFAULT_MODEL):
        """Initialize the generator with specified model"""
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("Transformers library not available")
        
        self.model_name = model_name
        self.generator = None
        self.cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_cache")
        os.makedirs(self.cache_dir, exist_ok=True)
        logger.info(f"Model cache directory: {self.cache_dir}")
        
        # Load in lazy mode to avoid loading model until needed
        self._initialize_generator()
    
    def _initialize_generator(self):
        """Initialize the text generation pipeline"""
        try:
            logger.info(f"Loading model: {self.model_name}")
            start_time = datetime.now()
            
            self.generator = pipeline(
                "text-generation", 
                model=self.model_name,
                device=0 if torch.cuda.is_available() else -1,  # Use GPU if available
                cache_dir=self.cache_dir
            )
            
            end_time = datetime.now()
            load_time = (end_time - start_time).total_seconds()
            device_type = 'GPU' if torch.cuda.is_available() else 'CPU'
            logger.info(f"Model loaded successfully on {device_type} in {load_time:.2f} seconds")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def generate(self, prompt: str, max_length: int = 150) -> str:
        """Generate text based on the prompt"""
        if not self.generator:
            self._initialize_generator()
        
        logger.info("Generating text...")    
        try:
            # Generate text
            result = self.generator(
                prompt, 
                max_new_tokens=max_length,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                num_return_sequences=1,
                return_full_text=True
            )
            
            generated_text = result[0]['generated_text']
            logger.info("Text generation complete")
            return generated_text
        except Exception as e:
            logger.error(f"Error generating text: {e}")
            raise
    
    def parse_response(self, response: str) -> Dict[str, Any]:
        """Parse the generated text into structured data"""
        # Default values
        fallback = {
            "conversationStarters": [
                "What made you join CampusLink?",
                "What's something unexpected you've learned this semester?"
            ],
            "activity": "Take a selfie together to commemorate your first meetup!",
            "sharedTopic": "Your academic journey and future career plans.",
            "rawResponse": response
        }
        
        try:
            # Extract conversation starters
            starters = re.findall(r'\d+\.\s+"(.+?)"', response)
            
            # Extract activity
            activity_match = re.search(r'(?:Mini-Activity|🎲).+?[""":](.+?)[""\n]', response)
            activity = activity_match.group(1).strip() if activity_match else fallback["activity"]
            
            # Extract shared topic
            topic_match = re.search(r'(?:Shared Topic|🎙).+?[""":](.+?)[""\n]', response)
            shared_topic = topic_match.group(1).strip() if topic_match else fallback["sharedTopic"]
            
            return {
                "conversationStarters": starters if len(starters) >= 2 else fallback["conversationStarters"],
                "activity": activity,
                "sharedTopic": shared_topic,
                "rawResponse": response
            }
        except Exception as e:
            logger.error(f"Error parsing response: {e}")
            return fallback
    
    def generate_icebreakers(self, user_a: Dict, user_b: Dict, 
                           meeting_date: str, location: str) -> Dict[str, Any]:
        """Generate icebreakers for two users meeting"""
        # Construct the prompt
        prompt = f"""
You are a friendly AI assistant helping two university students prepare for a coffee meetup. Your job is to generate icebreakers and conversation tips to help them feel at ease and find shared topics.

🎯 Output:
- 2 fun, casual conversation starters
- 1 light activity idea they can try during the meetup
- 1 shared interest, topic, or language to explore together

🧑 Student A:
- Name: {user_a.get('name', 'Student A')}
- Campus: {user_a.get('campus', 'University')}
- Interests: {', '.join(user_a.get('interests', ['learning']))}
- Languages: {', '.join(user_a.get('languages', ['English']))}
- Goals: {', '.join(user_a.get('goals', ['Academic success']))}
- Personality: {user_a.get('personality', 'Friendly')}

🧑 Student B:
- Name: {user_b.get('name', 'Student B')}
- Campus: {user_b.get('campus', 'University')}
- Interests: {', '.join(user_b.get('interests', ['meeting new people']))}
- Languages: {', '.join(user_b.get('languages', ['English']))}
- Goals: {', '.join(user_b.get('goals', ['Networking']))}
- Personality: {user_b.get('personality', 'Curious')}

📅 Meetup Info:
- Date: {meeting_date}
- Location: {location}

🧊 Example Output Format:
1. "What's the weirdest food you've tried since moving to campus?"
2. "If you could start a club together based on a shared interest, what would it be?"
🎲 Mini-Activity: "Swap your favorite go-to study playlist or song."
🎙 Shared Topic: "You both enjoy AI and Japanese – talk about how you're learning new languages!"
"""
        
        # Generate text with context-aware formatting for DistilGPT-2
        # Since DistilGPT-2 doesn't have the same context understanding as larger models,
        # we'll post-process the output to create the proper format
        generated_text = self.generate(prompt)
        
        # For DistilGPT-2, which may not follow the format perfectly, 
        # let's construct a more structured response
        user_a_interests = user_a.get('interests', ['learning'])
        user_b_interests = user_b.get('interests', ['meeting new people'])
        
        # Find common interests if any
        common_interests = [i for i in user_a_interests if i.lower() in [x.lower() for x in user_b_interests]]
        
        # Extract any usable text from the generation
        conversation_text = generated_text.replace(prompt, "").strip()
        
        # Try to extract conversation starters from the generated text
        starters = re.findall(r'\d+\.\s+"(.+?)"', conversation_text)
        
        # Create structured response
        structured_response = ""
        
        # Use extracted starters if available, otherwise use defaults
        if len(starters) >= 2:
            structured_response += f'1. "{starters[0]}"\n2. "{starters[1]}"\n'
        else:
            structured_response += f"""
1. "What do you think about {user_a_interests[0] if user_a_interests else 'your studies'} so far?"
2. "If you could change one thing about {location}, what would it be?"
"""
        
        # Add activity
        activity_match = re.search(r'(?:Mini-Activity|🎲).+?[""":](.+?)[""\n]', conversation_text)
        if activity_match:
            structured_response += f'🎲 Mini-Activity: "{activity_match.group(1).strip()}"\n'
        else:
            structured_response += f'🎲 Mini-Activity: "Take turns sharing a fun fact about your hometown."\n'
        
        # Add shared topic
        topic_match = re.search(r'(?:Shared Topic|🎙).+?[""":](.+?)[""\n]', conversation_text)
        if topic_match:
            structured_response += f'🎙 Shared Topic: "{topic_match.group(1).strip()}"'
        else:
            # Add shared topic if there are common interests
            if common_interests:
                structured_response += f'🎙 Shared Topic: "You both are interested in {common_interests[0]} – discuss what aspects you enjoy most!"'
            else:
                structured_response += f'🎙 Shared Topic: "Your experiences at {user_a.get("campus", "University")} and future plans."'
        
        # Combine the output with any usable generated text
        if len(conversation_text) > 20 and not starters:  # If we got meaningful output but couldn't extract starters
            structured_response += f"\n\nGenerated suggestions: {conversation_text}"
        
        # Parse the structured response
        return self.parse_response(structured_response)

def setup_flask_server(generator):
    """Set up a Flask server to serve the model"""
    try:
        from flask import Flask, request, jsonify
        from flask_cors import CORS  # Import CORS for cross-origin requests
        
        app = Flask(__name__)
        CORS(app)  # Enable CORS for all routes
        
        # Add a health check endpoint
        @app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({"status": "healthy", "model": generator.model_name})
        
        @app.route('/api/icebreakers', methods=['POST', 'HEAD'])
        def generate_icebreakers():
            # Handle HEAD request for availability check
            if request.method == 'HEAD':
                return '', 200
                
            try:
                data = request.json
                if not data:
                    return jsonify({"error": "No data provided"}), 400
                    
                user_a = data.get('userA', {})
                user_b = data.get('userB', {})
                meeting_date = data.get('meetingDate', 'Upcoming')
                location = data.get('location', 'Campus')
                
                logger.info(f"Generating icebreakers for {user_a.get('name')} and {user_b.get('name')}")
                result = generator.generate_icebreakers(user_a, user_b, meeting_date, location)
                return jsonify(result)
            except Exception as e:
                logger.error(f"Error generating icebreakers: {e}")
                return jsonify({"error": str(e)}), 500
        
        return app
    except ImportError as e:
        logger.error(f"Failed to set up Flask server: {e}")
        logger.error("Flask or Flask-CORS not installed. Install with: pip install flask flask-cors")
        sys.exit(1)

def main():
    """Main function to run the generator"""
    parser = argparse.ArgumentParser(description='Generate icebreakers using transformers')
    parser.add_argument('--serve', action='store_true', help='Run as a Flask API server')
    parser.add_argument('--model', type=str, default=DEFAULT_MODEL, help='Model to use')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    args = parser.parse_args()
    
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Debug mode enabled")
    
    if not TRANSFORMERS_AVAILABLE:
        logger.error("Transformers library not available. Install with: pip install transformers torch")
        sys.exit(1)
    
    try:
        # Initialize the generator
        generator = IcebreakerGenerator(model_name=args.model)
        
        if args.serve:
            # Run as a Flask server
            app = setup_flask_server(generator)
            logger.info(f"Starting Flask server on port {args.port}...")
            app.run(host='0.0.0.0', port=args.port, debug=args.debug)
        else:
            # Run as a command-line tool
            logger.info("Icebreaker Generator")
            logger.info("-------------------")
            logger.info("Generating sample icebreakers...")
            
            # Sample user data
            user_a = {
                "name": "Alex",
                "campus": "Central Campus",
                "interests": ["AI", "Music", "Photography"],
                "languages": ["English", "Spanish"],
                "goals": ["Graduate with honors", "Make new friends"],
                "personality": "Outgoing and creative"
            }
            
            user_b = {
                "name": "Jordan",
                "campus": "Central Campus",
                "interests": ["Machine Learning", "Travel", "Music"],
                "languages": ["English", "French"],
                "goals": ["Internship experience", "Expand network"],
                "personality": "Thoughtful and analytical"
            }
            
            result = generator.generate_icebreakers(
                user_a, user_b, "Next Friday", "Campus Coffee Shop"
            )
            
            logger.info("\nGenerated Icebreakers:")
            logger.info("----------------------")
            logger.info("Conversation Starters:")
            for i, starter in enumerate(result["conversationStarters"], 1):
                logger.info(f"{i}. \"{starter}\"")
            
            logger.info(f"\nActivity: \"{result['activity']}\"")
            logger.info(f"Shared Topic: \"{result['sharedTopic']}\"")
            
            logger.info("\nRaw Response:")
            logger.info("------------")
            logger.info(result["rawResponse"])
    
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 