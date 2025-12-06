from app.services.llm.providers import GroqLLM, GeminiLLM, OpenAILLM, LocalLLM
from app.core.config import settings
from app.core.logging import logger

class LLMRouter:
    def __init__(self):
        self._providers = {}

    def get_provider(self):
        """Get the configured LLM provider from settings."""
        provider_name = settings.DEFAULT_LLM_PROVIDER
        
        if provider_name not in self._providers:
            logger.info(f"Initializing LLM provider: {provider_name}")
            if provider_name == "groq":
                self._providers[provider_name] = GroqLLM()
            elif provider_name == "gemini":
                self._providers[provider_name] = GeminiLLM()
            elif provider_name == "openai":
                self._providers[provider_name] = OpenAILLM()
            elif provider_name == "local":
                self._providers[provider_name] = LocalLLM()
            else:
                # Default fallback
                logger.warning(f"Unknown provider '{provider_name}', falling back to OpenAI")
                if "openai" not in self._providers:
                     self._providers["openai"] = OpenAILLM()
                return self._providers["openai"]
                
        return self._providers[provider_name]
