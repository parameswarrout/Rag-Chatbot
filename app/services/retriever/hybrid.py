import os
import pickle
from typing import List, Dict, Any
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from app.services.retriever.base import BaseRetriever
from app.core.logging import logger

INDEX_DIR = "data/index"

class EnsembleRetriever:
    def __init__(self, retrievers: List[Any], weights: List[float]):
        self.retrievers = retrievers
        self.weights = weights

    def invoke(self, query: str) -> List[Document]:
        # Simple implementation: Collect all docs, deduplicate by content
        # For a real hybrid search, we'd use Reciprocal Rank Fusion (RRF)
        
        all_docs = []
        seen_content = set()
        
        for retriever in self.retrievers:
            docs = retriever.invoke(query)
            for doc in docs:
                if doc.page_content not in seen_content:
                    all_docs.append(doc)
                    seen_content.add(doc.page_content)
        
        return all_docs

class HybridRetriever(BaseRetriever):
    def __init__(self, embeddings: HuggingFaceEmbeddings):
        self.embeddings = embeddings
        self.vector_store = None
        self.bm25_retriever = None
        self.ensemble_retriever = None
        
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
        faiss_retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

        # 2. Build Sparse Index (BM25)
        self.bm25_retriever = BM25Retriever.from_documents(documents)
        self.bm25_retriever.k = 3

        # 3. Combine with Ensemble (Hybrid)
        self.ensemble_retriever = EnsembleRetriever(
            retrievers=[faiss_retriever, self.bm25_retriever],
            weights=[0.5, 0.5] # Equal weight to dense and sparse
        )
        
        # 4. Save to disk
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
            faiss_retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
            
            # Load documents and rebuild BM25
            with open(os.path.join(INDEX_DIR, "documents.pkl"), "rb") as f:
                documents = pickle.load(f)
                
            self.bm25_retriever = BM25Retriever.from_documents(documents)
            self.bm25_retriever.k = 3
            
            # Rebuild Ensemble
            self.ensemble_retriever = EnsembleRetriever(
                retrievers=[faiss_retriever, self.bm25_retriever],
                weights=[0.5, 0.5]
            )
            logger.info("Index loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load index: {e}")

    async def retrieve(self, query: str, top_k: int = 3) -> List[Document]:
        if not self.ensemble_retriever:
            # Return empty list instead of a string list with error message for better type safety
            return []
        
        docs = self.ensemble_retriever.invoke(query)
        return docs[:top_k]
