import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.containers import container
from app.core.logging import logger

def debug_ingest():
    print("Starting debug ingestion...")
    try:
        loader = container.document_loader
        documents = loader.load_documents()
        
        if not documents:
            print("No documents found.")
            return

        chunker = container.semantic_chunker
        chunked_docs = chunker.chunk_documents(documents)
        
        container.retriever.index_documents(chunked_docs)
        print(f"Indexed {len(chunked_docs)} chunks successfully.")
    except Exception as e:
        print(f"Ingestion failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_ingest()
