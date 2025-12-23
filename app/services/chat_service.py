import time
from typing import List
from fastapi import HTTPException
from app.models.schemas import QueryRequest, QueryResponse, Citation, ChatStreamRequest
from app.services.query_expansion.expander import QueryExpander
from app.services.router import LLMRouter
from app.services.retriever.hybrid import HybridRetriever
from app.services.memory_manager import MemoryManager
from app.core.logging import logger

class ChatService:
    def __init__(self, llm_router: LLMRouter, retriever: HybridRetriever):
        self.llm_router = llm_router
        self.retriever = retriever
        self.query_expander = QueryExpander()
        self.memory_manager = MemoryManager()

    def clear_all_sessions(self):
        self.memory_manager.clear_all_history()

    async def process_query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()
        logger.info(f"Processing query: {request.text}")

        # 0. Get History
        history_context = self.memory_manager.get_history(request.session_id)
        if history_context:
            logger.info(f"Retrieved history for session {request.session_id}")

        final_docs = []
        source_label = "LLM Only"
        
        # 1. Expand Query / Route based on Mode
        queries = [request.text] # Default single query

        if request.mode == "fast":
             # Fast mode: Single query, no expansion, small K
             final_docs = await self.retriever.retrieve(request.text, top_k=1)
             source_label = "HybridRetriever (Fast Mode)"
             queries = [request.text]

        elif request.mode == "simple":
             # Simple mode: Single query, moderate K
             final_docs = await self.retriever.retrieve(request.text, top_k=3)
             source_label = "HybridRetriever (Simple Mode)"
             queries = [request.text]
        
        else: # "advanced" (default)
             source_label = "HybridRetriever + Reranker + Expansion (Advanced Mode)"
             # Use Query Expansion
             queries = await self.query_expander.generate_queries(request.text)
             logger.info(f"Generated {len(queries)} queries: {queries}")

             # Retrieve for all queries concurrently
             import asyncio

             async def retrieve_single_query(query):
                 return await self.retriever.retrieve(query)  # This calls RRF/Rerank internally per query

             # Run all retrievals concurrently
             retrieval_tasks = [retrieve_single_query(query) for query in queries]
             all_retrieved_docs = await asyncio.gather(*retrieval_tasks)

             # Combine results from all queries
             unique_docs = {}
             for docs_list in all_retrieved_docs:
                 for doc in docs_list:
                     if doc.page_content not in unique_docs:
                         unique_docs[doc.page_content] = doc

             final_docs = list(unique_docs.values())

        # Prepare context and citations
        context = ""
        citations = []
        if final_docs:
            context = "\n\n".join([doc.page_content for doc in final_docs])
            citations = [
                Citation(content=doc.page_content, metadata=doc.metadata)
                for doc in final_docs
            ]

        # 3. Get LLM provider
        try:
            llm_provider = self.llm_router.get_provider(request.provider)
            logger.info(f"Selected LLM provider: {llm_provider.__class__.__name__}")
        except Exception as e:
            logger.error(f"Provider selection failed: {e}")
            raise HTTPException(status_code=500, detail=f"Provider selection failed: {str(e)}")

        # 4. Generate response
        try:
            # Append history to context
            full_context = context
            if history_context:
                full_context = f"PREVIOUS CONVERSATION HISTORY:\n{history_context}\n\nRETRIEVED DOCUMENT CONTEXT:\n{context}"
            
            answer = await llm_provider.generate(request.text, context=full_context)
            
            # 5. Save to Memory
            if request.session_id:
                self.memory_manager.add_turn(request.session_id, request.text, answer)

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
        yield "__STATUS__: Contextualizing query..."
        llm_provider = self.llm_router.get_provider(request.provider)
        search_query = user_query
        
        # ... (Rewrite logic skipped for brevity, keeping existing pass) ...
        
        # 3. Retrieve & Rerank
        final_docs = []
        if request.use_rag:
            yield "__STATUS__: Searching knowledge base..."
            try:
                # Mode-based retrieval
                if request.mode == "fast":
                    candidates = await self.retriever.retrieve(search_query, top_k=1)
                    final_docs = candidates
                
                elif request.mode == "simple":
                    candidates = await self.retriever.retrieve(search_query, top_k=3)
                    final_docs = candidates

                else: # advanced
                    yield "__STATUS__: Expanding queries & Reranking..."
                    # 1. Expand
                    queries = await self.query_expander.generate_queries(search_query)

                    # 2. Retrieve for all queries concurrently
                    import asyncio

                    async def retrieve_single_query(query):
                        return await self.retriever.retrieve(query, top_k=3)

                    # Run all retrievals concurrently
                    retrieval_tasks = [retrieve_single_query(q) for q in queries]
                    all_retrieved_docs = await asyncio.gather(*retrieval_tasks)

                    # 3. Combine results from all queries
                    unique_docs = {}
                    for docs_list in all_retrieved_docs:
                        for d in docs_list:
                            if d.page_content not in unique_docs:
                                unique_docs[d.page_content] = d

                    # 4. Take top 5 unique
                    final_docs = list(unique_docs.values())[:5]

            except Exception as e:
                logger.error(f"Retrieval error: {e}")
            
        context = ""
        if final_docs:
             context = "\n".join([d.page_content for d in final_docs])
             
        # 4. Stream Response
        yield "__STATUS__: Generating response..."
        try:
            async for chunk in llm_provider.stream_generate(search_query, context=context, model=request.model):
                yield chunk
            
            # 5. Yield Citations Metadata
            if final_docs:
                import json
                citations = [
                    {"content": doc.page_content, "metadata": doc.metadata}
                    for doc in final_docs
                ]
                yield "\n\n__METADATA__\n"
                yield json.dumps(citations)

        except Exception as e:
            logger.error(f"Streaming error: {repr(e)}")
            yield f"Error: {str(e)}"
