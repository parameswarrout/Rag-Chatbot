from typing import List
from langchain_experimental.text_splitter import SemanticChunker as LangChainSemanticChunker
from langchain_core.embeddings import Embeddings
from langchain_core.documents import Document

class SemanticChunker:
    def __init__(self, embeddings: Embeddings):
        self.splitter = LangChainSemanticChunker(
            embeddings=embeddings,
            breakpoint_threshold_type="percentile" # Standard default
        )

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        return self.splitter.split_documents(documents)
