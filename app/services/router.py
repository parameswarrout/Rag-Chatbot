from app.services.llm.providers import GroqLLM, GeminiLLM, OpenAILLM, LocalLLM
from app.core.config import settings
from app.core.logging import logger

class LLMRouter:
    def __init__(self):
        self.groq = None
        self.gemini = None
        self.openai = None
        self.local = None

    def get_provider(self, provider_name: str = None):
        """Get the configured LLM provider from settings or override."""
        if not provider_name:
             provider_name = settings.DEFAULT_LLM_PROVIDER
        
        logger.info(f"Selected LLM provider: {provider_name}")

        if provider_name == "groq":
            if not self.groq:
                self.groq = GroqLLM()
            return self.groq
        elif provider_name == "gemini":
            if not self.gemini:
                self.gemini = GeminiLLM()
            return self.gemini
        elif provider_name == "openai":
            if not self.openai:
                self.openai = OpenAILLM()
            return self.openai
        elif provider_name == "local":
            if not self.local:
                self.local = LocalLLM()
            return self.local
        else:
            # Default to openai if invalid provider specified
            if not self.openai:
                self.openai = OpenAILLM()
            return self.openai
