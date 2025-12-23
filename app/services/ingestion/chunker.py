from typing import List
from langchain_experimental.text_splitter import SemanticChunker
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from app.core.config import settings
import logging
from concurrent.futures import ThreadPoolExecutor
from itertools import islice

logger = logging.getLogger(__name__)

class SemanticChunkerService:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)
        self.splitter = SemanticChunker(
            self.embeddings,
            breakpoint_threshold_type="percentile"
        )

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        logger.info(f"Chunking {len(documents)} documents using SemanticChunker")

        # For large document lists, we can process them in batches to improve performance
        if len(documents) > 10:  # Only use multithreading for larger document sets
            # Split documents into smaller batches
            batch_size = max(1, len(documents) // settings.MAX_WORKERS)
            batches = [list(islice(documents, i, i + batch_size))
                      for i in range(0, len(documents), batch_size)]

            # Process batches concurrently
            all_chunks = []
            with ThreadPoolExecutor(max_workers=settings.MAX_WORKERS) as executor:
                batch_chunks = list(executor.map(self.splitter.split_documents, batches))
                for chunk_batch in batch_chunks:
                    all_chunks.extend(chunk_batch)

            chunks = all_chunks
        else:
            # For smaller sets, use the standard approach
            chunks = self.splitter.split_documents(documents)

        logger.info(f"Created {len(chunks)} chunks")
        return chunks
