#!/bin/bash

echo "Starting DistilGPT-2 Icebreaker Generator Server..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed! Please install Python 3.8 or later."
    exit 1
fi

# Display Python version
python3 --version
echo

# Check for required packages
echo "Checking for required packages..."
if ! python3 -c "import transformers, torch, flask, flask_cors" &> /dev/null; then
    echo "Installing required packages..."
    pip3 install transformers torch flask flask-cors
    if [ $? -ne 0 ]; then
        echo "Failed to install required packages. Please install them manually:"
        echo "pip3 install transformers torch flask flask-cors"
        exit 1
    fi
fi

# Create cache directory if it doesn't exist
if [ ! -d "model_cache" ]; then
    echo "Creating model cache directory..."
    mkdir -p model_cache
fi

# Start the server
echo
echo "Starting server on http://localhost:5000"
echo
echo "The model will be downloaded on first use (approximately 300MB)"
echo "This may take a few minutes the first time..."
echo
echo "Press Ctrl+C to stop the server"
echo
python3 transformers_generator.py --serve --port 5000 