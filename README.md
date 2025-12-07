# RAG Chatbot Platform

A production-ready Retrieval-Augmented Generation (RAG) platform that enables custom AI chatbots with private data. Features hybrid retrieval, multi-provider LLM support, and scalable architecture.

## Features

- **Document Ingestion**: Supports PDF, CSV, DOCX formats with semantic chunking
- **Multi-Provider LLM**: OpenAI, Google Gemini, Groq, and local Ollama integration
- **Hybrid Retrieval**: Combines vector search with keyword matching for accurate results
- **FastAPI Backend**: Scalable REST API with async processing
- **Dependency Injection**: Clean architecture for better testability

## Quick Start

### Prerequisites

- Python 3.11+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/parameswarrout/Rag-Chatbot.git
   cd Rag-Chatbot
   ```

2. Install Poetry (if not already installed):
   ```bash
   pip install poetry
   ```

3. Install project dependencies (Poetry will manage its own virtual environment):
   ```bash
   poetry install
   poetry env activate  # Activates the Poetry-managed virtual environment
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

### Configuration

Create a `.env` file with your API keys:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
LOCAL_LLM_URL=http://localhost:11434/v1
DEFAULT_LLM_PROVIDER=groq  # "openai", "gemini", "groq", or "local"
```

### Usage

1. Place documents in the `data/` directory
2. Start the ingestion process:
   ```bash
   curl -X POST http://localhost:8000/ingest
   ```
3. Query the system:
   ```bash
   curl -X POST http://localhost:8000/query \
     -H "Content-Type: application/json" \
     -d '{"text": "Your question here"}'
   ```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health status
- `POST /ingest` - Trigger document ingestion
- `POST /query` - Query the RAG system
- `POST /chat` - Streaming chat with history

## Development

Run in development mode:
```bash
uvicorn app.main:app --reload
```

## Tech Stack

- **Python 3.11+** - Core language
- **FastAPI** - Web framework
- **LangChain** - LLM orchestration
- **FAISS** - Vector store
- **Sentence Transformers** - Embeddings
- **Poetry** - Dependency management
