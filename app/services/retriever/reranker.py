from typing import List
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder

from app.core.config import settings

from app.core.logging import logger

class ReRanker:
    def __init__(self, model_name: str = settings.RERANKER_MODEL_NAME):
        """
        Initializes the CrossEncoder model for re-ranking.
        """
        logger.info(f"Initializing ReRanker with model: {model_name}")
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, documents: List[Document], top_k: int = 5) -> List[Document]:
        """
        Re-ranks a list of documents based on their relevance to the query.
        """
        if not documents:
            return []

        pairs = [[query, doc.page_content] for doc in documents]
        logger.debug(f"Computing cross-encoder scores for {len(documents)} documents")
        scores = self.model.predict(pairs)
        results = list(zip(documents, scores))
        results = sorted(results, key=lambda x: x[1], reverse=True)
        return [doc for doc, score in results[:top_k]]
