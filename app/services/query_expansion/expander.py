from typing import List
from app.services.router import LLMRouter
from app.core.config import settings
from app.core.logging import logger

class QueryExpander:
    def __init__(self):
        self.llm_router = LLMRouter()

    async def generate_queries(self, original_query: str) -> List[str]:
        """
        Generates multiple search queries based on the original user query.
        """
        if not settings.USE_QUERY_EXPANSION:
            return [original_query]

        count = settings.QUERY_EXPANSION_COUNT
        llm = self.llm_router.get_provider()
        
        prompt = (
            f"You are an AI assistant. Generate {count} different search queries "
            f"based on the user question to retrieve relevant documents. "
            f"Return them as a newline-separated list. Do not number them. "
            f"User Question: {original_query}"
        )

        try:
            # We assume the LLM provider has an async ainvoke or similar, 
            # checking LLM interface compliance might be needed.
            # Wrapper call to customized generate() method
            # Our custom providers return a simple string from generate()
            # We don't pass context here, just the prompting instruction.
            response_content = await llm.generate(prompt)
            
            queries = [q.strip() for q in response_content.split('\n') if q.strip()]
            
            # Ensure original query is included if not present (optional, but good practice)
            # RRF handles redundancy, so more is fine.
            if original_query not in queries:
                queries.append(original_query)
                
            return queries[:count+1] # Cap it slightly above count

        except Exception as e:
            logger.error(f"Query expansion failed: {e}")
            return [original_query]
