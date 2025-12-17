from app.core.config import settings
from app.services.router import LLMRouter
from app.services.retriever.hybrid import HybridRetriever
from app.services.ingestion.loader import DocumentLoader
from app.services.ingestion.chunker import SemanticChunkerService
from app.core.logging import logger

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
        self.retriever = HybridRetriever()
        self.document_loader = DocumentLoader()
        self.semantic_chunker = SemanticChunkerService()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

# Global instance for easy access in FastAPI dependencies
container = Container.get_instance()
