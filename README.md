# RAG Chatbot Platform

A production-ready Retrieval-Augmented Generation (RAG) platform for small businesses to deploy custom AI chatbots with their own data. Combines hybrid retrieval techniques with configurable LLM provider selection for optimal cost and performance, with comprehensive logging and monitoring for enterprise use.

## Features

- **Multi-Modal Document Ingestion**: Supports PDF, CSV, DOCX, and DOC files with security validation
- **Configurable LLM Provider**: Select the appropriate LLM provider based on your needs (OpenAI, Google Gemini, Groq, Local Ollama)
- **Hybrid Retrieval System**: Combines semantic search and traditional keyword search for optimal context retrieval
- **Multi-Provider Support**: Seamlessly integrates with OpenAI, Google Gemini, Groq, and Local Ollama
- **Semantic Chunking**: Intelligent document chunking for better context retrieval
- **FastAPI Backend**: Scalable and well-documented REST API with async support
- **Production Ready**: Built with security, monitoring, and performance in mind
- **Comprehensive Logging**: Structured logging system for monitoring and debugging
- **Dependency Injection**: Clean architecture with DI container for better testability
- **Easy Deployment**: Docker-based deployment with simple configuration
- **Cost Effective**: Supports free/local models to minimize operational costs

## Architecture

The system consists of several key components:

### 1. LLM Provider System
- Configurable provider selection via settings
- Supports OpenAI, Google Gemini, Groq, and Local Ollama providers
- Simple configuration-based provider selection
- Cost optimization based on selected provider

### 2. Dependency Injection Container
- Centralized service management with DI container
- Singleton pattern for efficient resource management
- Easy service swapping for testing and development
- Cleaner separation of concerns

### 3. Hybrid Retriever
- Combines vector similarity search with traditional keyword search (BM25)
- Efficient indexing using FAISS
- Semantic search capabilities with Sentence Transformers
- Persistent index storage with automatic loading

### 4. Document Ingestion Pipeline
- Secure document validation and type checking
- Supports multiple document formats (PDF, CSV, DOCX, DOC)
- Semantic chunking for optimal context windows
- Asynchronous processing with progress tracking
- Automated data loading from the `data/` directory

### 5. Comprehensive Logging System
- Structured logging with custom formatting
- Debug, info, warning, error, and critical level support
- Performance and usage monitoring
- Clean log output with timestamps and context

## Prerequisites

- Python 3.10+
- Poetry (for dependency management)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/parameswarrout/Rag-Chatbot.git
   cd Rag-Chatbot
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Activate the virtual environment:
   ```bash
   poetry shell
   ```

## Configuration

Create a `.env` file in the project root directory with your API keys:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
LOCAL_LLM_URL=http://localhost:11434/v1  # Default for Ollama
DEFAULT_LLM_PROVIDER=groq  # Can be "openai", "gemini", "groq", or "local"
```

The default LLM provider can be configured in `app/core/config.py`, but can also be overridden via the environment variable. For production deployments, consider using "local" to reduce costs and maintain data privacy.

## Deployment Options

### For Small Businesses

This platform is designed specifically for small businesses who want to deploy their own AI chatbots cost-effectively:

### Option 1: Local Deployment (Recommended for small businesses)
```bash
# Using Docker Compose for simple setup
docker-compose up -d
```

### Option 2: Cloud Deployment
- AWS, Azure, or GCP with simple deployment scripts
- Heroku one-click deployment available
- Kubernetes manifests for advanced deployments

### Option 3: Development Setup
For local LLM integration, you can use Ollama by running a local model:
```bash
ollama run llama3
```

Local models significantly reduce operational costs and ensure data privacy for sensitive business documents.

## Usage

### 1. Data Ingestion

Place your business documents (contracts, policies, FAQs, manuals) in the `data/` directory and trigger the ingestion process:

```bash
curl -X POST http://localhost:8000/ingest
```

The system will automatically detect file types, validate them for security, and load them into the retrieval system. Processing happens in the background and you can monitor the logs for progress.

### 2. Query Interface

Once data is ingested, you can query the system:

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is the main topic of the documents?"
  }'
```

### Query Parameters

- `text` (required): The query text

## API Endpoints

- `GET /`: Health check
- `GET /health`: Health status
- `POST /ingest`: Trigger document ingestion
- `POST /query`: Query the RAG system

## Development

To run the application in development mode:

```bash
uvicorn app.main:app --reload
```

The application will be available at `http://localhost:8000`.

## Project Structure

```
rag-agent/
├── app/
│   ├── api/          # API routes
│   ├── core/         # Core configurations
│   ├── models/       # Data models
│   ├── services/     # Business logic
│   │   ├── ingestion/ # Document loading & chunking
│   │   ├── llm/       # LLM providers & routing
│   │   └── retriever/ # Retrieval mechanisms
│   └── main.py       # Application entrypoint
├── data/             # Documents for ingestion
│   ├── csv/
│   └── index/        # Index storage
├── tests/            # Test suite
├── .env              # Environment variables
├── pyproject.toml    # Dependencies
└── README.md         # This file
```

## Technologies Used

- **Python 3.10+**: Core programming language
- **FastAPI**: High-performance web framework with automatic API documentation
- **LangChain**: LLM orchestration and integration
- **FAISS**: Vector similarity search for efficient retrieval
- **Sentence Transformers**: Embedding models for semantic search
- **Rank-BM25**: Keyword-based search for hybrid retrieval
- **Poetry**: Dependency management
- **PyPDF**: PDF parsing
- **Pandas**: CSV processing
- **httpx**: Async HTTP client for API calls
- **Structured Logging**: Comprehensive logging system with custom formatting
- **Dependency Injection**: DI container for service management
- **Docker**: Containerization for easy deployment

## Production Features

### Configuration Management
- Simple configuration-based LLM provider selection
- Cost optimization based on selected provider
- Easy switching between different LLM providers

### Architecture & Maintainability
- Dependency injection for better testability and modularity
- Separation of concerns with dedicated service classes
- Clean API layer with business logic abstraction

### Monitoring & Logging
- Colored structured logging with timestamps
- Performance metrics and response time tracking
- Provider selection logging
- Comprehensive error logging for debugging

### Security
- Input sanitization to prevent injection attacks
- File type validation and size restrictions
- API key management and rotation support
- Secure configuration handling

## Testing

Run the test suite:

```bash
pytest
```

## Business Benefits

- **Cost Effective**: Select cost-effective local models to minimize operational costs
- **Data Privacy**: Use local models to maintain complete control over sensitive data
- **Simple Configuration**: Easy provider selection through configuration settings
- **Easy Setup**: Simple deployment process designed for non-technical users
- **Scalable**: Architecture designed to grow with your business needs
- **Customizable**: Adapt the chatbot to your specific business requirements
- **Monitoring Ready**: Comprehensive logging for business analytics and optimization

## Support

For support, please open an issue in the repository or contact the maintainers.
