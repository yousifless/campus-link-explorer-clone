# Local DistilGPT-2 Icebreaker Generator

This directory contains the server implementation for a lightweight local LLM solution for generating icebreakers using DistilGPT-2. This server provides an API endpoint that the CampusLink application can call to generate personalized icebreaker suggestions for student meetups.

## Why DistilGPT-2?

- **Lightweight Architecture**: With approximately 82 million parameters, DistilGPT-2 is significantly smaller than larger models, making it suitable for devices with limited resources.
- **Performance Efficiency**: Despite its reduced size, it retains good performance for text generation tasks.
- **Resource-Friendly**: Capable of running on CPUs with as little as 2GB RAM, ideal for local deployments without specialized hardware.
- **No API Key Required**: Works completely offline, no need for external API access.

## Requirements

- Python 3.8+ 
- Node.js 14+ (if using the Node.js server implementation)
- Pip (Python package manager)

## Installation

1. Install the required Python packages:

```bash
pip install transformers torch flask flask-cors
```

2. For better performance with GPU (optional, requires CUDA):

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Running the Server

You can run the server directly using Python:

```bash
cd server/llm
python transformers_generator.py --serve --port 5000
```

This will start the Flask server on port 5000 and load the DistilGPT-2 model.

### Configuration Options

- `--model`: Specify a different model (default is distilgpt2)
- `--port`: Change the server port (default is 5000)

### Examples

Run with a specific port:
```bash
python transformers_generator.py --serve --port 8000
```

Run with a smaller model for even more resource-constrained environments:
```bash
python transformers_generator.py --serve --model distilgpt2
```

## Testing the Server

Once the server is running, you can test it with:

```bash
curl -X POST http://localhost:5000/api/icebreakers \
  -H "Content-Type: application/json" \
  -d '{
    "userA": {
      "name": "Alex",
      "campus": "Central Campus",
      "interests": ["AI", "Music", "Photography"],
      "languages": ["English", "Spanish"],
      "goals": ["Graduate with honors", "Make new friends"],
      "personality": "Outgoing and creative"
    },
    "userB": {
      "name": "Jordan",
      "campus": "Central Campus",
      "interests": ["Machine Learning", "Travel", "Music"],
      "languages": ["English", "French"],
      "goals": ["Internship experience", "Expand network"],
      "personality": "Thoughtful and analytical"
    },
    "meetingDate": "Next Friday",
    "location": "Campus Coffee Shop"
  }'
```

## Integration with CampusLink

The CampusLink application is configured to use this local LLM server by default:

1. The application first tries to connect to the local DistilGPT-2 server
2. If the server is unavailable, it falls back to a rule-based icebreaker generator
3. This ensures the application works even when the LLM server is not running

## Troubleshooting

### Model Loading Issues

If you encounter issues loading the model:

1. Check if you have enough disk space (DistilGPT-2 requires ~300MB of disk space)
2. Try downloading the model manually first:
   ```python
   from transformers import AutoTokenizer, AutoModelForCausalLM
   
   tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
   model = AutoModelForCausalLM.from_pretrained("distilgpt2")
   ```

### Connection Issues

If the application cannot connect to the server:

1. Ensure the server is running: `python transformers_generator.py --serve`
2. Check if the port is accessible and not blocked by a firewall
3. Verify the URL in the application matches the server address (.env file, VITE_LOCAL_LLM_URL)

### Resource Constraints

If your server is struggling with resource constraints:

1. Close other resource-intensive applications
2. Try a smaller model with `--model distilgpt2-small` if available
3. Reduce the batch size and context window settings in the code

## Performance Optimization

For better performance:

1. Use a CUDA-capable GPU if available
2. First-time model loading downloads the model and caches it for future use
3. Keep the server running for faster response times (model stays loaded in memory)

## Security Considerations

The server has CORS enabled for local development. In a production environment:

1. Configure CORS to only allow requests from trusted domains
2. Consider adding authentication for the API
3. Do not expose the server directly to the internet

## License

The transformers models are provided by Hugging Face and are subject to their license terms. This implementation is provided for educational and development purposes only. 