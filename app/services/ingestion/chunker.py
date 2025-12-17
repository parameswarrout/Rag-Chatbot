from typing import List
from langchain_experimental.text_splitter import SemanticChunker
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from app.core.config import settings

class SemanticChunkerService:
    def __init__(self):
        # Using the same embedding model as the retriever ensures compatibility
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)
        
        # Initialize Semantic Chunker
        # breakpoint_threshold_type="percentile" is a good default. 
        # It splits when the difference in similarity is in the top X percentile.
        self.splitter = SemanticChunker(
            self.embeddings, 
            breakpoint_threshold_type="percentile"
        )

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        return self.splitter.split_documents(documents)
