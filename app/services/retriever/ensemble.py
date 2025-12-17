from typing import List, Dict
from langchain_core.documents import Document

class EnsembleRetriever:
    def __init__(self, weights: List[float] = None, c: int = 60):
        """
        Args:
            weights: Optional weights for each retriever (not strictly used in standard RRF but kept for compatibility).
            c: RRF constant (default 60).
        """
        self.weights = weights
        self.c = c

    def rank_fusion(self, results: List[List[Document]]) -> List[Document]:
        """
        Applies Reciprocal Rank Fusion (RRF) to combine multiple lists of documents.
        """
        fused_scores: Dict[str, float] = {}
        doc_map: Dict[str, Document] = {}

        for doc_list in results:
            for rank, doc in enumerate(doc_list):
                # Use page_content as a fallback ID if no unique ID exists
                doc_id = doc.metadata.get("source", doc.page_content[:50]) 
                # Ideally, we should have a unique ID. Let's assume unique content for now or add a hash.
                # A more robust way is to rely on actual content uniqueness if IDs aren't persistent.
                doc_str_id = doc.page_content 
                
                if doc_str_id not in doc_map:
                    doc_map[doc_str_id] = doc
                
                # RRF score formula: 1 / (k + rank)
                score = 1.0 / (self.c + rank)
                
                if doc_str_id in fused_scores:
                    fused_scores[doc_str_id] += score
                else:
                    fused_scores[doc_str_id] = score

        # Sort documents by their fused score in descending order
        reranked_results = sorted(
            fused_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )

        return [doc_map[doc_id] for doc_id, score in reranked_results]
