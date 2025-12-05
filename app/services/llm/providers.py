import httpx
from typing import Optional
import google.generativeai as genai
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.llm.base import LLMProvider

STRICT_SYSTEM_PROMPT = """You are a helpful AI assistant.
Answer the user's question strictly based on the provided context below.
If the answer is not present in the context, state "I don't know" or "The answer is not in the provided documents."
Do not use outside knowledge.
"""

class GroqLLM(LLMProvider):
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.groq.com/openai/v1"
        )

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            # Even without context, we might want to warn or just pass the prompt.
            # But the requirement is to stick to knowledge base. 
            # If no context is provided (e.g. retrieval failed or empty), the system prompt still applies 
            # and it should likely say "I don't know" because there is no context.
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"
            
        response = await self.client.chat.completions.create(
            model="openai/gpt-oss-20b", # Groq model ID might differ, keeping original
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content

class GeminiLLM(LLMProvider):
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"

        response = await self.model.generate_content_async(full_prompt)
        return response.text

class OpenAILLM(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"

        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": full_prompt}]
        )
        return response.choices[0].message.content

class LocalLLM(LLMProvider):
    def __init__(self):
        self.base_url = settings.LOCAL_LLM_URL
        self.client = httpx.AsyncClient(base_url=self.base_url)

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"

        # Assuming OpenAI-compatible API (e.g., Ollama, LM Studio)
        response = await self.client.post("/chat/completions", json={
            "model": "local-model", # Model name often ignored by local servers or set to specific one
            "messages": [{"role": "user", "content": full_prompt}],
            "temperature": 0.7
        })
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
