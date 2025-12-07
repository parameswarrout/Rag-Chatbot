# RAG Orchestration Agent

A sophisticated Retrieval-Augmented Generation (RAG) platform that enables intelligent question-answering over private documents with support for multiple LLM providers and hybrid search capabilities.

## Features

- **Multi-Format Document Support**: Ingests PDF, CSV, and DOCX documents seamlessly
- **Hybrid Retrieval System**: Combines semantic vector search (FAISS) with keyword matching (BM25) for optimal results
- **LLM Provider Flexibility**: Supports OpenAI, Google Gemini, Groq, and local models (Ollama/LM Studio)
- **Advanced Query Modes**: Three retrieval strategies - Fast, Simple, and Advanced (with reranking)
- **Semantic Chunking**: Intelligent document segmentation using semantic boundaries
- **Cross-Encoder Reranking**: Improves result relevance using specialized models
- **Streaming Chat Interface**: Real-time conversation with memory and context awareness
- **Asynchronous Processing**: Non-blocking API endpoints for high performance
- **Configurable Architecture**: Clean dependency injection for easy testing and maintenance

## Architecture Overview

The system is organized into several key components:

- **API Layer**: FastAPI endpoints for ingestion, querying, and streaming chat
- **Service Layer**: ChatService orchestrates the entire RAG pipeline
- **Ingestion Layer**: Loads documents in multiple formats and performs semantic chunking
- **Retrieval Layer**: HybridRetriever combines vector and keyword search
- **LLM Layer**: Router and providers for different LLM services
- **DI Container**: Centralized dependency management for all services

## Prerequisites

- Python 3.9+
- API keys for your chosen LLM provider (OpenAI, Google Gemini, or Groq), OR Ollama running locally

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Rag-Chatbot
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   # source .venv/bin/activate  # On Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

## Configuration

Create a `.env` file with your preferred settings:

```env
# LLM API Keys (only required for the provider you plan to use)
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Local LLM Configuration (for Ollama, LM Studio, etc.)
LOCAL_LLM_URL=http://localhost:11434/v1

# Default provider: "openai", "gemini", "groq", or "local"
DEFAULT_LLM_PROVIDER=groq

# Logging Configuration
LOG_TO_CONSOLE=true
LOG_DIR=logs
LOG_FILENAME=app.log
```

## Usage

### 1. Prepare Your Documents

Place your documents in the `data/` directory in any supported format (PDF, CSV, DOCX):

```
data/
├── document1.pdf
├── document2.csv
└── document3.docx
```

### 2. Start the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Ingest Documents

Trigger the document ingestion process:

```bash
curl -X POST http://localhost:8000/ingest
```

This will:
- Load all documents from the `data/` directory
- Perform semantic chunking
- Index documents using the hybrid retrieval system

### 4. Query the System

#### Simple Query
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What are the main points in this document?"
  }'
```

#### Query with Specific Mode
The system offers three query modes:

- **fast**: Light retrieval with minimal context (top 1 result)
- **simple**: Standard retrieval with normal context (top 3 results)
- **advanced**: Retrieval + reranking for highest precision (top 10 retrieved, then reranked to top 3)

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Explain the key concepts in detail",
    "mode": "advanced"
  }'
```

#### Streaming Chat
For conversational interactions with memory:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is this document about?"},
      {"role": "assistant", "content": "The document discusses various topics..."},
      {"role": "user", "content": "Can you elaborate on the key features?"}
    ],
    "mode": "advanced"
  }'
```

### 5. Check Health Status

```bash
curl http://localhost:8000/health
```

## API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `GET` | `/` | Root endpoint, returns service status | - |
| `GET` | `/health` | Health check endpoint | - |
| `POST` | `/ingest` | Trigger document ingestion | - |
| `POST` | `/query` | Query the RAG system | `{"text": "query", "mode": "fast/simple/advanced"}` |
| `POST` | `/chat` | Streaming chat with history | `{"messages": [...], "mode": "fast/simple/advanced"}` |

## Query Modes Explained

- **Fast Mode**: Retrieves only 1 document, fastest response time but potentially less comprehensive answers
- **Simple Mode**: Retrieves 3 documents using standard hybrid search, balanced between speed and accuracy
- **Advanced Mode**: Retrieves 10 documents, then uses a cross-encoder model to rerank them, returning the top 3 most relevant results for the highest accuracy

## Development

### Running Tests

```bash
pytest
```

### Environment Setup

The project uses a clean architecture with dependency injection. Key components:

- **DocumentLoader**: Handles various file formats (PDF, CSV, DOCX)
- **SemanticChunker**: Uses sentence transformers to intelligently chunk documents
- **HybridRetriever**: Combines FAISS vector search with BM25 keyword search
- **Reranker**: Uses cross-encoder models to improve result relevance
- **LLMRouter**: Dynamically selects the configured LLM provider

### Adding New Features

1. Add new services to the `app/services/` directory
2. Register them in the `app/containers.py` DI container
3. Create endpoints in `app/api/routes.py`
4. Add corresponding schemas in `app/models/schemas.py`

## Tech Stack

- **Python 3.9+** - Core programming language
- **FastAPI** - Modern, fast web framework with async support
- **LangChain** - Framework for developing LLM applications
- **FAISS** - Efficient similarity search and clustering
- **BM25** - Classic keyword-based retrieval algorithm
- **Sentence Transformers** - State-of-the-art sentence embeddings
- **Hugging Face Models** - Embeddings and reranking models
- **Pydantic** - Data validation and settings management
- **HTTPX** - Async HTTP client for external API calls

## Performance Considerations

- The hybrid retrieval system balances semantic understanding (FAISS) with keyword matching (BM25)
- Semantic chunking creates more contextually meaningful document segments than fixed-size splitting
- Cross-encoder reranking improves result relevance at the cost of additional processing time
- Asynchronous processing ensures high throughput under load

## Troubleshooting

1. **API Keys**: Ensure your `.env` file contains the appropriate API keys for your selected provider
2. **Index Persistence**: The system saves and loads indexes from `data/index/` for persistence across restarts
3. **Model Downloads**: First run may take longer as embedding and reranking models download automatically
4. **Local LLM**: For local models, ensure Ollama or your local server is running at the configured URL

## License

This project is licensed under the MIT License - see the LICENSE file for details.
