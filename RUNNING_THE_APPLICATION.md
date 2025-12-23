# Running the RAG Chatbot Application

This guide provides step-by-step instructions for running the backend, frontend, and Ollama for the RAG Chatbot application.

## Prerequisites

- Python 3.9+
- Node.js (v16 or higher)
- npm or yarn
- Ollama (for local LLM support)

## 1. Setting up the Backend

### Step 1: Navigate to the project directory
```bash
cd E:\Rag-Chatbot
```

### Step 2: Create and activate a virtual environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure environment variables
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env with your API keys and configuration
```

### Step 5: Set up your .env file
Edit the `.env` file with your preferred settings:

```env
# LLM API Keys (only required for the provider you plan to use)
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Local LLM Configuration (for Ollama, LM Studio, etc.)
LOCAL_LLM_URL=http://localhost:11434/v1

# Default provider: "openai", "gemini", "groq", or "local"
DEFAULT_LLM_PROVIDER=local

# Logging Configuration
LOG_TO_CONSOLE=true
LOG_DIR=logs
LOG_FILENAME=app.log
```

### Step 6: Start the backend server
```bash
# Using uvicorn
uvicorn app.main:app --reload

# The backend will be available at http://localhost:8000
```

## 2. Setting up the Frontend

### Step 1: Navigate to the frontend directory
```bash
cd E:\Rag-Chatbot\frontend
```

### Step 2: Install frontend dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Start the frontend development server
```bash
npm run dev
# or
yarn dev
```

### Step 4: Access the frontend
The frontend will be available at `http://localhost:5173` (default Vite port)

## 3. Setting up Ollama (Local LLM)

### Step 1: Install Ollama
1. Go to [https://ollama.com](https://ollama.com) and download Ollama for your operating system
2. Follow the installation instructions for your platform
3. Verify installation by running:
```bash
ollama --version
```

### Step 2: Start Ollama server
```bash
# Start the Ollama service (usually runs automatically after installation)
ollama serve
```

### Step 3: Pull a model for local usage
```bash
# Example: Pull a popular model like Llama 3
ollama pull llama3

# Or pull other models like mistral, phi3, etc.
ollama pull mistral
```

### Step 4: Verify Ollama is running
```bash
# Check if Ollama is accessible at the default URL
curl http://localhost:11434/api/tags
```

## 4. Complete Application Setup

### Option A: Running all components separately (Development)

1. **Start Ollama** (if using local LLM):
   ```bash
   ollama serve
   ```

2. **Start the backend**:
   ```bash
   cd E:\Rag-Chatbot
   .venv\Scripts\activate  # Windows
   uvicorn app.main:app --reload
   ```

3. **Start the frontend**:
   ```bash
   cd E:\Rag-Chatbot\frontend
   npm run dev
   ```

### Option B: Using environment configuration

Make sure your `.env` file has the correct settings for local LLM:
```env
LOCAL_LLM_URL=http://localhost:11434/v1
DEFAULT_LLM_PROVIDER=local
```

## 5. Testing the Setup

### Backend API Test
```bash
# Check backend health
curl http://localhost:8000/health

# Ingest documents (place documents in data/ directory first)
curl -X POST http://localhost:8000/ingest

# Test a query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What are the main points in this document?",
    "mode": "simple"
  }'
```

### Frontend Test
1. Open your browser to `http://localhost:5173`
2. The frontend should connect to the backend at `http://localhost:8000`
3. You should be able to upload documents and ask questions

## 6. Troubleshooting

### Common Issues:

1. **Port already in use**:
   - Backend: Use `uvicorn app.main:app --reload --port 8001`
   - Frontend: The Vite server will automatically find an available port

2. **Ollama not responding**:
   - Verify Ollama service is running: `ollama serve`
   - Check if the model is pulled: `ollama list`
   - Verify the URL in `.env` matches Ollama's address

3. **Backend can't connect to frontend**:
   - Check CORS settings in `app/main.py`
   - Ensure both services are running

4. **Environment variables not loading**:
   - Verify `.env` file is in the correct location (project root)
   - Restart the backend server after changing `.env`

### Useful Commands:

- **Check running processes**:
  ```bash
  # Windows
  netstat -ano | findstr :8000
  netstat -ano | findstr :11434
  
  # Linux/Mac
  lsof -i :8000
  lsof -i :11434
  ```

- **Stop processes**:
  ```bash
  # Find the process ID and kill it
  # Windows: taskkill /PID <PID> /F
  # Linux/Mac: kill -9 <PID>
  ```

## 7. Production Deployment

For production deployment:

1. Use a production WSGI server for the backend (like Gunicorn):
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. Build the frontend for production:
   ```bash
   cd E:\Rag-Chatbot\frontend
   npm run build
   ```

3. Serve the frontend build with a web server (Nginx, Apache, etc.)

## 8. API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root endpoint, returns service status |
| `GET` | `/health` | Health check endpoint |
| `POST` | `/ingest` | Trigger document ingestion |
| `POST` | `/query` | Query the RAG system |
| `POST` | `/chat` | Streaming chat with history |

## Query Modes:

- **fast**: Light retrieval with minimal context (top 1 result)
- **simple**: Standard retrieval with normal context (top 3 results)
- **advanced**: Retrieval + reranking for highest precision (top 10 retrieved, then reranked to top 3)