import httpx
import json
import asyncio

BASE_URL = "http://localhost:8000"

async def test_query(text, complexity, privacy_level):
    url = f"{BASE_URL}/query"
    payload = {
        "text": text,
        "complexity": complexity,
        "privacy_level": privacy_level
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            # We expect errors due to missing keys, but we want to see the error detail
            if response.status_code != 200:
                print(f"Query: {text} | Complexity: {complexity} | Privacy: {privacy_level}")
                print(f"Status: {response.status_code}")
                print(response.text)
            else:
                print(f"Query: {text} | Complexity: {complexity} | Privacy: {privacy_level}")
                print(json.dumps(response.json(), indent=2))
            print("-" * 50)
        except Exception as e:
            print(f"Error: {e}")

async def main():
    # Wait for server to start
    await asyncio.sleep(2)
    
    print("Testing Health Check...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BASE_URL}/health")
            print(resp.json())
        except:
            print("Server not running?")
            return

    print("\nTesting Routing...")
    # 1. Simple Public -> Groq
    await test_query("What is the capital of France?", "simple", "public")

    # 2. Moderate Public -> Gemini
    await test_query("Explain quantum entanglement.", "moderate", "public")

    # 3. Complex Public -> OpenAI
    await test_query("Write a novel about AI rights.", "complex", "public")

    # 4. Private -> Local
    await test_query("Analyze this confidential report.", "simple", "private")

    print("\nTesting Ingestion...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/ingest")
        print(resp.json())
        # Wait for background task
        await asyncio.sleep(5) 

    print("\nTesting Retrieval (RAG)...")
    # Should retrieve from test.csv
    await test_query("Who is the CEO of RAG Corp?", "simple", "public")

if __name__ == "__main__":
    asyncio.run(main())
