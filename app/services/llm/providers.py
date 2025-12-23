import httpx
from typing import Optional
import logging
import google.generativeai as genai
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.llm.base import LLMProvider

logger = logging.getLogger(__name__)

STRICT_SYSTEM_PROMPT = """You are a helpful AI assistant.
First, check the provided context below to answer the user's question.
If the answer is found in the context, cite the specific information.
If the answer is NOT in the context, or if the context is empty, you SHOULD use your own general knowledge to answer the question helpfully.
Do not state "I don't know" unless you truly cannot answer.
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
            
        logger.info(f"GroqLLM Request: Prompt='{prompt}', Context_Len={len(context) if context else 0}")
        try:
            response = await self.client.chat.completions.create(
                model="openai/gpt-oss-20b", # Groq model ID set per user request
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.7
            )
            content = response.choices[0].message.content
            logger.info("GroqLLM Response received")
            return content
        except Exception as e:
            logger.error(f"GroqLLM Error: {e}")
            raise e

    async def stream_generate(self, prompt: str, context: Optional[str] = None, **kwargs):
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"
            
        logger.info(f"GroqLLM Stream Request: Prompt='{prompt}'")
        try:
            stream = await self.client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.7,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"GroqLLM Stream Error: {e}")
            raise e

class GeminiLLM(LLMProvider):
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"

        logger.info(f"GeminiLLM Request: Prompt='{prompt}'")
        try:
            response = await self.model.generate_content_async(full_prompt)
            logger.info("GeminiLLM Response received")
            return response.text
        except Exception as e:
            logger.error(f"GeminiLLM Error: {e}")
            raise e

    async def stream_generate(self, prompt: str, context: Optional[str] = None, **kwargs):
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"
            
        response = await self.model.generate_content_async(full_prompt, stream=True)
        async for chunk in response:
            yield chunk.text

class OpenAILLM(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"

        logger.info(f"OpenAILLM Request: Prompt='{prompt}'")
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": full_prompt}]
            )
            logger.info("OpenAILLM Response received")
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAILLM Error: {e}")
            raise e

    async def stream_generate(self, prompt: str, context: Optional[str] = None, **kwargs):
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}"
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}"
            
        stream = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": full_prompt}],
            stream=True
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

class LocalLLM(LLMProvider):
    def __init__(self):
        self.base_url = settings.LOCAL_LLM_URL
        self.client = httpx.AsyncClient(base_url=self.base_url)

    async def generate(self, prompt: str, context: Optional[str] = None, **kwargs) -> str:
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}\n\nNote: Please provide a short, concise answer."
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}\n\nNote: Please provide a short, concise answer."

        # Ollama API (Native)
        # Note: If using /v1/chat/completions, we need to ensure Ollama runs with compat.
        # But let's use the native /api/chat for robustness if /v1 failed.
        # However, providers.py was written assuming OpenAI compat.
        # Let's try fixing the Base URL usage. 
        # If config has /v1, httpx append /chat/completions -> /v1/chat/completions.
        # Ollama usually serves at root.
        
        # NOTE: standard ollama is http://localhost:11434
        # If settings.LOCAL_LLM_URL is http://localhost:11434/v1, then the code effectively calls .../v1/chat/completions
        # If that 404s, maybe Ollama version is old or we should use /api/generate (non-chat) or /api/chat.
        
        # Let's switch to native /api/chat for safety with default ollama install.
        
        logger.info(f"LocalLLM Request: Prompt='{prompt}'")
        
        # Updating strictly to use /api/chat requires changing how we call it.
        # Ollama native API: POST /api/chat {"model": "...", "messages": [...]}
        
        # We need to strip /v1 from base_url if it's there
        base = self.base_url.replace("/v1", "")
        if base.endswith("/"):
            base = base[:-1]
            
        try:
            async with httpx.AsyncClient(base_url=base, timeout=120.0) as client:
                response = await client.post("/api/chat", json={
                    "model": settings.LOCAL_LLM_MODEL, 
                    "messages": [{"role": "user", "content": full_prompt}],
                    "stream": False,
                    "options": {"temperature": 0.7}
                })
                if response.status_code == 404:
                    # Fallback to 'llama3.2:1b' if 'llama3.2' not found? 
                    # Or just raise error. The user said they installed it.
                    # Let's try to pull if missing? No, that's too much magic.
                    raise Exception(f"Model '{settings.LOCAL_LLM_MODEL}' not found on Ollama server. Please run `ollama pull {settings.LOCAL_LLM_MODEL}`")
                response.raise_for_status()
                logger.info("LocalLLM Response received")
                return response.json()["message"]["content"]
        except Exception as e:
            logger.error(f"LocalLLM Error: {e}")
            raise e

    async def stream_generate(self, prompt: str, context: Optional[str] = None, **kwargs):
        if context:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: {context}\n\nQuestion: {prompt}\n\nNote: Please provide a short, concise answer."
        else:
            full_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nContext: None\n\nQuestion: {prompt}\n\nNote: Please provide a short, concise answer."
            
        base = self.base_url.replace("/v1", "")
        if base.endswith("/"):
            base = base[:-1]
            
        async with httpx.AsyncClient(base_url=base, timeout=60.0) as client:
            try:
                # Use custom model if provided, else from settings
                model = kwargs.get('model') or settings.LOCAL_LLM_MODEL
                
                async with client.stream("POST", "/api/chat", json={
                    "model": model,
                    "messages": [{"role": "user", "content": full_prompt}],
                    "stream": True,
                    "options": {"temperature": 0.7}
                }) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        raise Exception(f"Ollama API Error: {response.status_code} - {error_text.decode()}")
                        
                    async for chunk in response.aiter_lines():
                        if chunk:
                            import json
                            try:
                                data = json.loads(chunk)
                                content = data.get("message", {}).get("content", "")
                                if content:
                                    yield content
                                if data.get("done", False):
                                    break
                            except Exception as parse_err:
                                print(f"JSON Parse Error: {parse_err}, Chunk: {chunk}")
                                pass
            except Exception as e:
                raise e
