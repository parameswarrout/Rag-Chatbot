from app.services.llm.providers import GroqLLM, GeminiLLM, OpenAILLM, LocalLLM
from app.core.config import settings
from app.core.logging import logger

class LLMRouter:
    def __init__(self):
        self.groq = GroqLLM()
        self.gemini = GeminiLLM()
        self.openai = OpenAILLM()
        self.local = LocalLLM()

    def get_provider(self):
        """Get the configured LLM provider from settings."""
        provider_name = settings.DEFAULT_LLM_PROVIDER
        logger.info(f"Selected LLM provider: {provider_name}")

        if provider_name == "groq":
            return self.groq
        elif provider_name == "gemini":
            return self.gemini
        elif provider_name == "openai":
            return self.openai
        elif provider_name == "local":
            return self.local
        else:
            # Default to openai if invalid provider specified
            return self.openai
