import httpx
import asyncio
import os
import shutil
from app.services.retriever.hybrid import HybridRetriever

BASE_URL = "http://localhost:8001"
INDEX_DIR = "data/index"

async def test_ingest():
    print("Triggering Ingestion...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/ingest", timeout=30.0)
        print(f"Ingest Response: {resp.json()}")
        # Wait for background task to finish (it prints to stdout, but we can't see it easily here)
        # We'll wait a bit
        await asyncio.sleep(5)

def verify_files_exist():
    if os.path.exists(INDEX_DIR) and os.path.exists(os.path.join(INDEX_DIR, "index.faiss")) and os.path.exists(os.path.join(INDEX_DIR, "documents.pkl")):
        print("SUCCESS: Index files found on disk.")
        return True
    else:
        print("FAILURE: Index files NOT found on disk.")
        return False

async def verify_load_offline():
    print("\nTesting Offline Loading (simulating restart)...")
    try:
        retriever = HybridRetriever()
        if retriever.vector_store is not None and retriever.bm25_retriever is not None:
            print("SUCCESS: HybridRetriever loaded index from disk.")
            
            # Test retrieval
            docs = await retriever.retrieve("What is FAISS?")
            print(f"Retrieved {len(docs)} docs.")
            if len(docs) > 0:
                print("SUCCESS: Retrieval works after loading.")
            else:
                print("FAILURE: Retrieval returned no docs.")
        else:
            print("FAILURE: HybridRetriever did not load index.")
    except Exception as e:
        print(f"FAILURE: Exception during offline load: {e}")

async def main():
    # 1. Clean up previous index if exists to be sure
    if os.path.exists(INDEX_DIR):
        shutil.rmtree(INDEX_DIR)
        print("Cleared previous index.")

    # 2. Ingest via API
    await test_ingest()

    # 3. Verify files created
    if verify_files_exist():
        # 4. Verify loading in a fresh instance
        await verify_load_offline()

if __name__ == "__main__":
    asyncio.run(main())
