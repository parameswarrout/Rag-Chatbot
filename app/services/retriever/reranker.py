from typing import List
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder
from app.core.logging import logger

class Reranker:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        logger.info(f"Loading Reranker model: {model_name}...")
        try:
            self.model = CrossEncoder(model_name)
        except Exception as e:
            logger.error(f"Failed to load Reranker model: {e}")
            self.model = None

    def rerank(self, query: str, documents: List[Document], top_k: int = 3) -> List[Document]:
        if not self.model or not documents:
            return documents[:top_k]

        # Prepare pairs for CrossEncoder [query, doc_text]
        pairs = [[query, doc.page_content] for doc in documents]
        
        try:
            scores = self.model.predict(pairs)
            
            # Combine docs with scores
            doc_scores = list(zip(documents, scores))
            
            # Sort by score descending
            doc_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Select top_k
            ranked_docs = [doc for doc, score in doc_scores[:top_k]]
            logger.info(f"Reranked {len(documents)} documents to top {len(ranked_docs)}")
            return ranked_docs
            
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            return documents[:top_k]
