from typing import List
from app.services.retriever.base import BaseRetriever

class MockRetriever(BaseRetriever):
    async def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        # Return dummy documents for testing
        return [
            f"Document 1 relevant to {query}",
            f"Document 2 relevant to {query}",
            f"Document 3 relevant to {query}"
        ]
