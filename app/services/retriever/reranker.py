from typing import List
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder

from app.core.config import settings

class ReRanker:
    def __init__(self, model_name: str = settings.RERANKER_MODEL_NAME):
        """
        Initializes the CrossEncoder model for re-ranking.
        """
        # This will download the model if not present.
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, documents: List[Document], top_k: int = 5) -> List[Document]:
        """
        Re-ranks a list of documents based on their relevance to the query.
        
        Args:
            query: The user query.
            documents: List of candidate documents.
            top_k: Number of top documents to return.
            
        Returns:
            List[Document]: The top_k re-ranked documents.
        """
        if not documents:
            return []

        # Prepare pairs for the model: (query, document_text)
        pairs = [[query, doc.page_content] for doc in documents]
        
        # Predict scores
        scores = self.model.predict(pairs)
        
        # Combine docs with their scores
        results = list(zip(documents, scores))
        
        # Sort by score descending
        results = sorted(results, key=lambda x: x[1], reverse=True)
        
        # Return top_k docs
        return [doc for doc, score in results[:top_k]]
