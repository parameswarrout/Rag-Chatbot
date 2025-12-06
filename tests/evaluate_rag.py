import asyncio
import httpx
import time
from typing import List, Dict

# Configuration
API_URL = "http://localhost:8000/api/v1/query" # Adjust if your prefix is different, likely just /query based on routes.py check
# Checking routes.py again... it was @router.post("/query").
# Main.py likely mounts it. I should check main.py to be sure of the full URL.
# Assuming http://127.0.0.1:8000/query for now based on typical fastAPI.

# Test Data (Ground Truth)
TEST_CASES = [
    {
        "question": "What is a transformer model?",
        "expected_keywords": ["neural network", "self-attention", "parallel"],
        "difficulty": "easy"
    },
    {
        "question": "What is RAG?",
        "expected_keywords": ["Retrieval-Augmented Generation", "external information", "model retrieves"],
        "difficulty": "medium"
    },
    {
        "question": "What is the capital of Mars?",
        "expected_keywords": ["I do not know", "representative"],
        "difficulty": "hallucination_check"
    }
]

MODES = ["fast", "simple", "advanced"]

async def evaluate_query(client: httpx.AsyncClient, question: str, mode: str, expected_keywords: List[str]):
    start = time.time()
    try:
        response = await client.post("http://127.0.0.1:8000/query", json={"text": question, "mode": mode})
        response.raise_for_status()
        data = response.json()
        latency = time.time() - start
        
        answer = data["answer"]
        source = data["source"]
        citations = data.get("citations", [])
        
        # Keyword Match Score
        matches = [kw for kw in expected_keywords if kw.lower() in answer.lower()]
        score = len(matches) / len(expected_keywords) if expected_keywords else 1.0
        
        return {
            "mode": mode,
            "latency": f"{latency:.3f}s",
            "score": f"{score:.2f}",
            "source": source,
            "citations": len(citations),
            "matches": matches,
            "citations": len(citations),
            "matches": matches,
            "answer_full": answer
        }
    except Exception as e:
        return {"mode": mode, "error": str(e)}

async def run_evaluation():
    print(f"{'='*20} RAG EVALUATION REPORT {'='*20}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        for case in TEST_CASES:
            print(f"\n❓ Question: {case['question']}")
            print(f"   Expected: {case['expected_keywords']}")
            
            conversation_results = []
            for mode in MODES:
                result = await evaluate_query(client, case["question"], mode, case["expected_keywords"])
                conversation_results.append(result)
                print(f"   ► [{mode.upper()}] Source: {result.get('source', 'Error')}")
                print(f"      Answer: \"{result.get('answer_full', '')}\"")
                print(f"      Score: {result.get('score', 0)} (Matches: {result.get('matches', [])})")
                if "error" in result:
                    print(f"      Error: {result['error']}")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
