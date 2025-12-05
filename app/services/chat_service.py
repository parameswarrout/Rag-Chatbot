import time
from fastapi import HTTPException
from app.models.schemas import QueryRequest, QueryResponse
from app.services.router import LLMRouter
from app.services.retriever.hybrid import HybridRetriever
from app.core.logging import logger

class ChatService:
    def __init__(self, llm_router: LLMRouter, retriever: HybridRetriever):
        self.llm_router = llm_router
        self.retriever = retriever

    async def process_query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.time()
        logger.info(f"Processing query: {request.text} | Complexity: {request.complexity}")

        # 1. Retrieve context
        try:
            documents = await self.retriever.retrieve(request.text)
            context = "\n".join(documents)
            logger.debug(f"Retrieved {len(documents)} documents.")
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            # Fallback to empty context
            context = ""

        # 2. Route to LLM
        try:
            llm_provider = self.llm_router.route(request.complexity, request.privacy_level)
            logger.info(f"Routed to LLM provider: {llm_provider.__class__.__name__}")
        except Exception as e:
            logger.error(f"Routing failed: {e}")
            raise HTTPException(status_code=500, detail=f"Routing failed: {str(e)}")

        # 3. Generate response
        try:
            answer = await llm_provider.generate(request.text, context=context)
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

        latency = time.time() - start_time
        logger.info(f"Query processed in {latency:.4f}s")

        return QueryResponse(
            answer=answer,
            source="HybridRetriever",
            model_used=llm_provider.__class__.__name__,
            latency=latency
        )
