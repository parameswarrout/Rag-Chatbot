import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"

async def test_query(text, complexity="simple", privacy_level="public"):
    url = f"{BASE_URL}/query"
    payload = {
        "text": text,
        "complexity": complexity,
        "privacy_level": privacy_level
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=30.0)
            print(f"Query: {text}")
            if response.status_code == 200:
                data = response.json()
                print(f"Answer: {data['answer']}")
                print(f"Model: {data['model_used']}")
            else:
                print(f"Error: {response.status_code} - {response.text}")
            print("-" * 50)
        except Exception as e:
            print(f"Exception: {e}")

async def main():
    print("Triggering Ingestion...")
    async with httpx.AsyncClient() as client:
        await client.post(f"{BASE_URL}/ingest")
        await asyncio.sleep(2) # Give it a moment

    print("\n--- Testing In-Context Query ---")
    await test_query("What is FAISS?")

    print("\n--- Testing Out-of-Context Query (General Knowledge) ---")
    await test_query("Who is the president of the USA?")

    print("\n--- Testing Out-of-Context Query (Simple Fact) ---")
    await test_query("What is the capital of France?")

if __name__ == "__main__":
    asyncio.run(main())
