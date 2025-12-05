from app.services.llm.providers import GroqLLM, GeminiLLM, OpenAILLM, LocalLLM
from app.models.schemas import ComplexityLevel, PrivacyLevel
from app.core.logging import logger

class LLMRouter:
    def __init__(self):
        self.groq = GroqLLM()
        self.gemini = GeminiLLM()
        self.openai = OpenAILLM()
        self.local = LocalLLM()

    def route(self, complexity: ComplexityLevel, privacy_level: PrivacyLevel):
        logger.info(f"Routing query - Complexity: {complexity}, Privacy: {privacy_level}")

        if privacy_level == PrivacyLevel.PRIVATE:
            return self.local

        if complexity == ComplexityLevel.SIMPLE:
            return self.groq
        elif complexity == ComplexityLevel.MODERATE:
            return self.gemini
        elif complexity == ComplexityLevel.COMPLEX:
            return self.openai
        else:
            # Default fallback
            return self.openai
