from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        """
        Generate a response from the LLM based on the prompt and optional context.
        """
        pass

    @abstractmethod
    async def stream_generate(self, prompt: str, context: Optional[str] = None, **kwargs):
        """
        Yield response chunks from the LLM.
        """
        pass
