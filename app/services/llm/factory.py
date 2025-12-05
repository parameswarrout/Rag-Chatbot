from app.services.llm.providers import GroqLLM, GeminiLLM, OpenAILLM, LocalLLM
from app.services.llm.base import LLMProvider

class LLMFactory:
    @staticmethod
    def get_provider(provider_name: str) -> LLMProvider:
        if provider_name == "groq":
            return GroqLLM()
        elif provider_name == "gemini":
            return GeminiLLM()
        elif provider_name == "openai":
            return OpenAILLM()
        elif provider_name == "local":
            return LocalLLM()
        else:
            raise ValueError(f"Unknown provider: {provider_name}")
