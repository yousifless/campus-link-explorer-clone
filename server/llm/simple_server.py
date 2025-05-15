#!/usr/bin/env python3
"""
Simple Flask server to verify that Flask is correctly installed
"""
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"status": "success", "message": "Flask server is running correctly"})

if __name__ == "__main__":
    print("Starting simple Flask server on port 5000...")
    print("Test with: curl http://localhost:5000/api/test")
    app.run(host='0.0.0.0', port=5000) 