from abc import ABC, abstractmethod
from typing import List

class BaseRetriever(ABC):
    @abstractmethod
    async def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        """
        Retrieve relevant documents based on the query.
        """
        pass
