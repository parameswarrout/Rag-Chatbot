from app.core.config import settings
from app.services.router import LLMRouter
from app.services.retriever.hybrid import HybridRetriever
from app.services.ingestion.loader import DocumentLoader
from app.services.ingestion.chunker import SemanticChunker

from app.services.retriever.reranker import Reranker
from app.core.logging import logger

from langchain_huggingface import HuggingFaceEmbeddings

class Container:
    """
    Simple Dependency Injection Container.
    In a larger app, we might use `dependency-injector` or similar,
    but for this scope, a singleton manager is sufficient.
    """
    _instance = None

    def __init__(self):
        logger.info("Initializing DI Container...")
        self.settings = settings
        self.llm_router = LLMRouter()
        
        # Shared Embeddings
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        self.retriever = HybridRetriever(embeddings=self.embeddings)
        self.document_loader = DocumentLoader()
        self.semantic_chunker = SemanticChunker(embeddings=self.embeddings)
        self.reranker = Reranker()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

# Global instance for easy access in FastAPI dependencies
container = Container.get_instance()
