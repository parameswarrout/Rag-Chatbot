from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "RAG Orchestration Agent"
    VERSION: str = "0.1.0"

    GROQ_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    LOCAL_LLM_URL: str = "http://localhost:11434/v1"

    DEFAULT_LLM_PROVIDER: str = "openai"  # Can be "openai", "gemini", "groq", or "local"

    class Config:
        env_file = ".env"

settings = Settings()
