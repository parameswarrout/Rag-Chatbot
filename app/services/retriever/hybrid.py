import os
import pickle
from typing import List, Dict, Optional, Any
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from app.services.retriever.base import BaseRetriever
from app.services.retriever.ensemble import EnsembleRetriever
from app.services.retriever.reranker import ReRanker
from app.core.logging import logger

INDEX_DIR = "data/index"

from app.core.config import settings

class HybridRetriever(BaseRetriever):
    def __init__(
        self,
        use_rrf: bool = settings.USE_RRF,
        use_rerank: bool = settings.USE_RERANK,
        rrf_k: int = settings.RRF_K,
        top_k_retrieval: int = settings.TOP_K_RETRIEVAL
    ):
        """
        Args:
            use_rrf: Whether to use Reciprocal Rank Fusion.
            use_rerank: Whether to use Cross-Encoder Re-ranking.
            rrf_k: RRF constant 'k'.
            top_k_retrieval: Number of documents to retrieve from each source before fusion/reranking.
        """
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)
        self.vector_store = None
        self.bm25_retriever = None
        
        # Configuration Flags
        self.use_rrf = use_rrf
        self.use_rerank = use_rerank
        self.top_k_retrieval = top_k_retrieval
        
        # Initialize Components
        if self.use_rrf:
            self.ensemble = EnsembleRetriever(c=rrf_k)
        
        if self.use_rerank:
            # We initialize reranker lazily or here. Here is fine.
            self.reranker = ReRanker()

        # Try loading existing index on startup
        if os.path.exists(INDEX_DIR) and os.path.exists(os.path.join(INDEX_DIR, "index.faiss")):
            logger.info("Loading existing index from disk...")
            self.load_index()
        else:
            logger.warning("No existing index found. Please ingest data.")

    def index_documents(self, documents: List[Document]):
        if not documents:
            return

        # 1. Build Dense Index (FAISS)
        self.vector_store = FAISS.from_documents(documents, self.embeddings)
        
        # 2. Build Sparse Index (BM25)
        self.bm25_retriever = BM25Retriever.from_documents(documents)
        self.bm25_retriever.k = self.top_k_retrieval

        # 3. Save to disk
        self.save_index(documents)

    def save_index(self, documents: List[Document]):
        if not os.path.exists(INDEX_DIR):
            os.makedirs(INDEX_DIR)
            
        # Save FAISS index
        self.vector_store.save_local(INDEX_DIR)
        
        # Save documents for BM25 reconstruction
        with open(os.path.join(INDEX_DIR, "documents.pkl"), "wb") as f:
            pickle.dump(documents, f)
            
        logger.info(f"Index and documents saved to {INDEX_DIR}")

    def load_index(self):
        try:
            # Load FAISS index
            self.vector_store = FAISS.load_local(
                INDEX_DIR, 
                self.embeddings, 
                allow_dangerous_deserialization=True
            )
            
            # Load documents and rebuild BM25
            with open(os.path.join(INDEX_DIR, "documents.pkl"), "rb") as f:
                documents = pickle.load(f)
                
            self.bm25_retriever = BM25Retriever.from_documents(documents)
            self.bm25_retriever.k = self.top_k_retrieval
            
            logger.info("Index loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load index: {e}")

    def clear_index(self):
        """Clears the in-memory and on-disk index."""
        self.vector_store = None
        self.bm25_retriever = None
        
        if os.path.exists(INDEX_DIR):
            try:
                import shutil
                shutil.rmtree(INDEX_DIR)
                logger.info(f"Cleared index directory: {INDEX_DIR}")
            except Exception as e:
                logger.error(f"Failed to clear index directory: {e}")
        else:
             logger.info("Index directory does not exist, nothing to clear.")

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:

        if not self.vector_store or not self.bm25_retriever:
            logger.warning("Attempted retrieval without indexed data.")
            return []

        logger.info(f"Hybrid Retrieval started for query: '{query}'")

        # Run vector and keyword retrieval concurrently using ThreadPoolExecutor
        import asyncio
        from concurrent.futures import ThreadPoolExecutor

        def retrieve_vector():
            # 1. Retrieve from Vector Store (with filters)
            # FAISS supports filters if the underlying docstore supports it, or we can use search_kwargs
            # For standard FAISS in LangChain, filter support depends on the implementation.
            # Usually it's passed as 'filter' in search_kwargs.
            search_kwargs = {"k": self.top_k_retrieval}
            if filters:
                search_kwargs["filter"] = filters

            return self.vector_store.similarity_search(query, **search_kwargs)

        def retrieve_keyword():
            # 2. Retrieve from BM25 (Keyword)
            # BM25 doesn't natively support metadata filtering easily in this implementation.
            # We retrieve raw and then could filter manually, but for now we just retrieve.
            self.bm25_retriever.k = self.top_k_retrieval
            keyword_docs = self.bm25_retriever.invoke(query)

            # Apply manual filtering to BM25 results if filters exist
            if filters:
                filtered_keyword_docs = []
                for doc in keyword_docs:
                    match = True
                    for key, value in filters.items():
                        if doc.metadata.get(key) != value:
                            match = False
                            break
                    if match:
                        filtered_keyword_docs.append(doc)
                keyword_docs = filtered_keyword_docs

            return keyword_docs

        # Execute retrieval tasks concurrently
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor(max_workers=2) as executor:  # 2 workers for vector + keyword retrieval
            vector_task = loop.run_in_executor(executor, retrieve_vector)
            keyword_task = loop.run_in_executor(executor, retrieve_keyword)

            vector_docs, keyword_docs = await asyncio.gather(vector_task, keyword_task)

        logger.debug(f"Vector Store result count: {len(vector_docs)}")
        logger.debug(f"BM25 result count: {len(keyword_docs)}")

        # 3. Fuse Results
        if self.use_rrf:
            fused_docs = self.ensemble.rank_fusion([vector_docs, keyword_docs])
            logger.debug(f"RRF Fusion resulting in {len(fused_docs)} unique docs")
        else:
            # Simple fallback: Combine and deduplicate
            # Prioritize vector docs, then append unseen keyword docs
            seen_content = set()
            fused_docs = []
            for doc in vector_docs + keyword_docs:
                if doc.page_content not in seen_content:
                    fused_docs.append(doc)
                    seen_content.add(doc.page_content)

        # Limit candidates before re-ranking if we have too many?
        # RRF already sorts them. We pass all to reranker up to a reasonable limit to save time?
        # Let's pass top_k_retrieval * 2 or just all of them if reasonable.
        # For safety/speed, let's limit to top_k_retrieval (e.g. 50) before reranking.
        candidates = fused_docs[:self.top_k_retrieval]

        # 4. Re-rank
        if self.use_rerank:
            logger.debug("Re-ranking candidates...")
            final_docs = self.reranker.rerank(query, candidates, top_k=top_k)
            logger.info(f"Re-ranking complete. Returning {len(final_docs)} docs.")
        else:
            final_docs = candidates[:top_k]
            logger.info(f"Skipping re-ranking. Returning {len(final_docs)} docs.")

        return final_docs
