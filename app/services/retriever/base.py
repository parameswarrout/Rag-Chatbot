from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from langchain_core.documents import Document

class BaseRetriever(ABC):
    @abstractmethod
    async def retrieve(self, query: str, top_k: int = 3, filters: Optional[Dict[str, Any]] = None) -> List[Document]:
        """
        Retrieve relevant documents based on the query.
        """
        pass
