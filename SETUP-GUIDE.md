# CampusLink Setup Guide

This guide will help you set up and run the CampusLink application, including all its components and the new DistilGPT-2 icebreaker generator.

## Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.8+ (for the local DistilGPT-2 server)
- Supabase account (for database and authentication)

## Project Structure

The CampusLink application consists of several components:

- **Frontend**: React application with TypeScript
- **Database**: Supabase PostgreSQL database
- **Local LLM Server**: Python-based DistilGPT-2 for icebreaker generation

## Installation Steps

### 1. Frontend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd campus-link-explorer-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_LOCAL_LLM_URL=http://localhost:5000/api/icebreakers
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### 2. DistilGPT-2 Icebreaker Generator Setup

The application includes a local LLM server using DistilGPT-2 for generating icebreaker questions. This eliminates the need for external API calls to services like Hugging Face.

#### Installing Dependencies

1. Make sure you have Python 3.8 or later installed:
   ```bash
   python --version
   ```

2. Install the required Python packages:
   ```bash
   pip install transformers torch flask flask-cors
   ```

3. For better performance with CUDA-enabled GPUs (optional):
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

#### Starting the DistilGPT-2 Server

1. Navigate to the server directory:
   ```bash
   cd server/llm
   ```

2. Start the server using the provided scripts:
   
   **On Windows:**
   ```bash
   start_server.bat
   ```

   **On macOS/Linux:**
   ```bash
   chmod +x start_server.sh
   ./start_server.sh
   ```

   Or run the Python script directly:
   ```bash
   python transformers_generator.py --serve --port 5000
   ```

3. The server will start on http://localhost:5000 and will automatically download the DistilGPT-2 model on first use (approximately 300MB).

4. Test that the server is running correctly:
   ```bash
   curl -X POST http://localhost:5000/api/icebreakers \
     -H "Content-Type: application/json" \
     -d '{
       "userA": {"name": "Test User A", "campus": "Test Campus", "interests": ["AI"], "languages": ["English"], "goals": ["Learning"], "personality": "Friendly"},
       "userB": {"name": "Test User B", "campus": "Test Campus", "interests": ["AI"], "languages": ["English"], "goals": ["Learning"], "personality": "Friendly"},
       "meetingDate": "Tomorrow",
       "location": "Test Location"
     }'
   ```

#### Server Configuration Options

- Change the port: `--port 8000`
- Use a different model: `--model distilgpt2`
- Adjust resource usage by modifying parameters in the Python script

### 3. Application Features

The CampusLink application with DistilGPT-2 integration offers several key features:

- **Personalized Icebreakers**: Generate conversation starters based on user profiles
- **Offline Operation**: Works without internet connection once the model is downloaded
- **Fallback Mechanism**: Uses rule-based generation if the LLM server is unavailable
- **Resource Efficiency**: DistilGPT-2 can run on standard laptops without dedicated GPUs

## Troubleshooting

### Frontend Issues

- **Connection errors**: Ensure your Supabase credentials are correct
- **API errors**: Check that all environment variables are set correctly

### DistilGPT-2 Server Issues

- **Model downloading fails**: Check your internet connection or try downloading manually
- **Out of memory errors**: Close other applications or use a smaller model
- **Server won't start**: Ensure all dependencies are installed correctly
- **Connection refused errors**: Make sure the port isn't being used by another application

## Advanced Configuration

### Customizing the DistilGPT-2 Implementation

You can customize the DistilGPT-2 server by modifying:

1. **Model Selection**: Change the model in `transformers_generator.py`
2. **Prompt Engineering**: Adjust the prompt templates in `transformers_generator.py`
3. **Response Formatting**: Modify the parsing logic in `icebreaker-service.ts`

### Deployment Considerations

For production deployment:

1. Use a proper process manager (PM2, systemd) to keep the server running
2. Configure proper CORS settings for security
3. Consider setting up a reverse proxy (Nginx, Apache) for the API server

## Additional Resources

- [Transformers Documentation](https://huggingface.co/docs/transformers/index)
- [DistilGPT-2 Model Card](https://huggingface.co/distilgpt2)
- [Flask Documentation](https://flask.palletsprojects.com/) 