from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "RAG Orchestration Agent"
    VERSION: str = "0.1.0"

    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    LOCAL_LLM_URL: str = "http://localhost:11434/v1"

    DEFAULT_LLM_PROVIDER: str = "groq"  # Can be "openai", "gemini", "groq", or "local"

    # --- Retriever Configuration ---
    # Embedding Model for Vector Search
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Re-ranking Model
    RERANKER_MODEL_NAME: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    
    # Flags
    USE_RRF: bool = True
    USE_RERANK: bool = True
    
    # Parameters
    RRF_K: int = 60
    TOP_K_RETRIEVAL: int = 50

    # --- Query Expansion Configuration ---
    USE_QUERY_EXPANSION: bool = True
    QUERY_EXPANSION_COUNT: int = 3

    class Config:
        env_file = ".env"

settings = Settings()
