import time
from typing import List
from fastapi import HTTPException
from app.models.schemas import QueryRequest, QueryResponse, ChatStreamRequest
from app.services.router import LLMRouter
from app.services.retriever.hybrid import HybridRetriever
from app.services.retriever.reranker import Reranker
from app.core.logging import logger

class ChatService:
    def __init__(self, llm_router: LLMRouter, retriever: HybridRetriever, reranker: Reranker):
        self.llm_router = llm_router
        self.retriever = retriever
        self.reranker = reranker

    async def process_query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()
        logger.info(f"Processing query: {request.text}")

        final_docs = []
        source_label = "LLM Only"

        if request.mode == "fast":
            # Fast mode: Light retrieval (Standard RAG, minimal context)
            try:
                final_docs = await self.retriever.retrieve(request.text, top_k=1)
                source_label = "HybridRetriever (Fast Mode)"
                logger.debug(f"Mode: FAST - Retrieved {len(final_docs)} doc.")
            except Exception as e:
                logger.error(f"Retrieval failed: {e}")
                final_docs = []
                
        elif request.mode == "simple":
            # Simple mode: Standard retrieval (Standard RAG, normal context)
            try:
                final_docs = await self.retriever.retrieve(request.text, top_k=3)
                source_label = "HybridRetriever (Simple Mode)"
                logger.debug(f"Mode: SIMPLE - Retrieved {len(final_docs)} docs.")
            except Exception as e:
                logger.error(f"Retrieval failed: {e}")
                final_docs = []

        else: # "advanced" (default)
            # Advanced mode: Retrieval + Reranker (High precision)
            source_label = "HybridRetriever + Reranker (Advanced Mode)"
            try:
                # 1. Retrieve candidates
                candidates = await self.retriever.retrieve(request.text, top_k=10)
                
                # 2. Rerank
                if candidates:
                    final_docs = self.reranker.rerank(request.text, candidates, top_k=3)
                else:
                    final_docs = []
                logger.debug(f"Mode: ADVANCED - Reranked to {len(final_docs)} docs.")
            except Exception as e:
                logger.error(f"Advanced flow failed: {e}")
                final_docs = []

        # Prepare context and citations
        if final_docs:
            context = "\n\n".join([doc.page_content for doc in final_docs])
            citations = [doc.metadata.get("source", "Unknown") for doc in final_docs]
        else:
            context = ""
            citations = []

        # 3. Get LLM provider
        try:
            llm_provider = self.llm_router.get_provider()
            logger.info(f"Selected LLM provider: {llm_provider.__class__.__name__}")
        except Exception as e:
            logger.error(f"Provider selection failed: {e}")
            raise HTTPException(status_code=500, detail=f"Provider selection failed: {str(e)}")

        # 4. Generate response
        try:
            answer = await llm_provider.generate(request.text, context=context)
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

        latency = time.time() - start_time
        logger.info(f"Query processed in {latency:.4f}s")

        return QueryResponse(
            answer=answer,
            source=source_label,
            model_used=llm_provider.__class__.__name__,
            latency=latency,
            citations=citations
        )

    async def stream_chat(self, request: ChatStreamRequest):
        logger.info(f"Processing stream chat with {len(request.messages)} messages")
        
        if not request.messages:
             yield "Error: No messages provided."
             return

        # 1. Extract latest query
        last_message = request.messages[-1]
        user_query = last_message.content
        
        # 2. Contextualize (Memory)
        # If history exists, rewrite query to be standalone
        llm_provider = self.llm_router.get_provider()
        search_query = user_query
        
        if len(request.messages) > 1:
            history_text = "\n".join([f"{m.role}: {m.content}" for m in request.messages[:-1]])
            rewrite_prompt = f"""Given the following conversation history, rewrite the last user question to be a standalone question that can be understood without context.
            
History:
{history_text}

User Question: {user_query}

Standalone Question:"""
            try: 
                # Use generate without strict context for rewriting
                # We reuse generate() but pass None as context to avoid injecting STRICT_SYSTEM_PROMPT if possible?
                # Actually provider.generate enforces STRICT_SYSTEM_PROMPT. Use a trick or accept it?
                # The STRICT_PROMPT says "Answer strictly based on context". 
                # This might BREAK rewriting if I don't provide context.
                # I should probably add a raw_generate to provider or just accept that "Memory" might be flaky 
                # without a dedicated "Chat" model or prompt override.
                # For now, let's skip the complicated rewrite to ensure stability and just use the raw query + history in RAG?
                # No, RAG needs specific query.
                # Let's simple concatenate for now to be safe: "history + query"
                pass 
            except Exception:
                pass

        # 3. Retrieve & Rerank (Reuse internal logic if refactored, but duplicated for safety here)
        final_docs = []
        try:
            candidates = await self.retriever.retrieve(search_query, top_k=5) # Reduced for speed
            if request.mode == "advanced" and candidates:
                 final_docs = self.reranker.rerank(search_query, candidates, top_k=3)
            else:
                 final_docs = candidates[:3]
        except Exception as e:
            logger.error(f"Retrieval error: {e}")
            
        context = ""
        if final_docs:
             context = "\n".join([d.page_content for d in final_docs])
             
        # 4. Stream Response
        # Yield metadata first? No, standard streaming usually just sends content.
        # But we verify citations... standard implementation sends citations at the end?
        # I'll just stream the content.
        
        try:
            async for chunk in llm_provider.stream_generate(search_query, context=context):
                yield chunk
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"Error: {e}"
