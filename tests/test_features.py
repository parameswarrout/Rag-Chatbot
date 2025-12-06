import asyncio
import httpx
import json

async def test_streaming():
    print("Testing Streaming Endpoint (/chat)...")
    url = "http://127.0.0.1:8000/chat"
    payload = {
        "messages": [{"role": "user", "content": "What is RAG?"}],
        "mode": "simple",
        "stream": True
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        async with client.stream("POST", url, json=payload) as response:
            print("Status:", response.status_code)
            if response.status_code != 200:
                print("Error:", await response.read())
                return

            full_text = ""
            print("Response Chunks:")
            async for chunk in response.aiter_text():
                print(f"[{chunk}]", end="", flush=True)
                full_text += chunk
            print(f"\n\nFull Length: {len(full_text)}")
            if len(full_text) > 10:
                print("✅ Streaming Successful")
            else:
                print("❌ Streaming output too short")

if __name__ == "__main__":
    asyncio.run(test_streaming())
