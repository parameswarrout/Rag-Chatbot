import time
from fastapi import HTTPException
from app.models.schemas import QueryRequest, QueryResponse, Citation
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

    async def process_query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()
        logger.info(f"Processing query: {request.text}")

        # 0. Get History
        history_context = self.memory_manager.get_history(request.session_id)
        if history_context:
            logger.info(f"Retrieved history for session {request.session_id}")

        # 1. Expand Query
        queries = await self.query_expander.generate_queries(request.text)
        logger.info(f"Generated {len(queries)} queries: {queries}")

        # 2. Retrieve context for all queries
        unique_docs = {} # Map content to Doc to keep metadata
        try:
            for query in queries:
                docs = await self.retriever.retrieve(query)
                for doc in docs:
                    # Deduplicate by content
                    if doc.page_content not in unique_docs:
                        unique_docs[doc.page_content] = doc
            
            # Sort documents if needed or just convert to list
            retrieved_docs = list(unique_docs.values())
            context = "\n".join([d.page_content for d in retrieved_docs])
            logger.debug(f"Retrieved {len(retrieved_docs)} unique documents.")
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            retrieved_docs = []
            context = ""

        # 2b. Prepare Citations
        citations = [
            Citation(content=doc.page_content, metadata=doc.metadata)
            for doc in retrieved_docs
        ]

        # 3. Get LLM provider
        try:
            llm_provider = self.llm_router.get_provider()
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
            source="HybridRetriever",
            model_used=llm_provider.__class__.__name__,
            latency=latency,
            citations=citations
        )
