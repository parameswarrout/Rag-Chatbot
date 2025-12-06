import asyncio
from app.containers import container

async def inspect():
    print("Inspecting Retrieved Chunks...")
    retriever = container.retriever
    
    # Use a query that should fetch a specific concept
    query = "What is a transformer?"
    
    docs = await retriever.retrieve(query, top_k=3)
    
    print(f"\nQuery: '{query}'")
    print(f"Retrieved {len(docs)} chunks.\n")
    
    for i, doc in enumerate(docs):
        content = doc.page_content
        length = len(content)
        print(f"--- Chunk {i+1} (Length: {length} chars) ---")
        print(f"Content Start: {content[:100]}...")
        print(f"Content End:   ...{content[-100:]}")
        print("-" * 50)
        
    print("\nObservation Guide:")
    print("1. If lengths are extremely uniform (e.g. all ~900-1000), it might still be Fixed Size.")
    print("2. If lengths vary widely (e.g. 200, 800, 1500), Semantic Chunking is likely active.")

if __name__ == "__main__":
    asyncio.run(inspect())
