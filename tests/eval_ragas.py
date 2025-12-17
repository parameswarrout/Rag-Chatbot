import asyncio
import os
import pandas as pd
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    ContextPrecision,
    Faithfulness,
    AnswerRelevancy,
    ContextRecall,
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

from app.services.router import LLMRouter
from app.services.retriever.hybrid import HybridRetriever
from app.services.chat_service import ChatService
from app.models.schemas import QueryRequest
from app.core.config import settings

# Sample Data
EVAL_DATA = [
    {
        "question": "What is semantic chunking?",
        "ground_truth": "Semantic chunking is a method of splitting text into chunks based on semantic similarity rather than just character count."
    },
    {
        "question": "How does RRF work?",
        "ground_truth": "Reciprocal Rank Fusion (RRF) combines the rankings of multiple retrieval methods (like keyword and vector search) to produce a unified ranking."
    }
]

async def run_evaluation():
    print("--- Starting RAGAS Evaluation ---")
    
    # 1. Initialize RAG Pipeline
    llm_router = LLMRouter()
    retriever = HybridRetriever()
    chat_service = ChatService(llm_router, retriever)
    
    # 2. Generate Answers & Contexts
    results = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": []
    }
    
    for item in EVAL_DATA:
        print(f"Processing: {item['question']}")
        
        # Call RAG Pipeline
        req = QueryRequest(text=item['question'], session_id="eval-session")
        response = await chat_service.process_query(req)
        
        # Extract Data
        results["question"].append(item['question'])
        results["answer"].append(response.answer)
        results["ground_truth"].append(item['ground_truth'])
        
        # Extract contexts from citations
        # Ragas expects List[str] for contexts
        contexts = [c.content for c in response.citations]
        results["contexts"].append(contexts)
        
    # 3. Create Dataset
    dataset = Dataset.from_dict(results)

    # 4. Configure Ragas (LLM & Embeddings)
    print("\nConfiguring Ragas...")
    
    # Embeddings: Reuse the one from Retriever (HuggingFace)
    embeddings = retriever.embeddings
    
    # LLM: Use Local Ollama (Small Model for 8GB RAM)
    # Falling back to others if needed, but prioritizing Local as requested.
    try:
        from langchain_ollama import ChatOllama
        llm = ChatOllama(
            model="llama3.2", # Small model (3B) suitable for 8GB RAM
            temperature=0,
            base_url=settings.LOCAL_LLM_URL.replace("/v1", "") # Ollama default is usually just host:port
        )
        print("Using Local Ollama (llama3.2) for Ragas.")
    except ImportError:
        print("langchain-ollama not installed. Please install it.")
        return

    # Fallback/Safety Check (though we expect Ollama)
    if not llm:
        print("CRITICAL: Could not initialize Ollama.")
        return

    print("\nRunning Ragas Evaluation (this may take a moment)...")
    try:
        # Pass llm and embeddings explicitly
        scores = evaluate(
            dataset=dataset,
            metrics=[
                ContextPrecision(),
                Faithfulness(),
                AnswerRelevancy(),
                ContextRecall(),
            ],
            llm=llm,
            embeddings=embeddings
        )
        
        print("\n--- Evaluation Results ---")
        df = scores.to_pandas()
        print(df[["user_input", "faithfulness", "answer_relevancy", "context_recall", "context_precision"]])
        print("\nAverage Scores:")
        print(scores)
        print("\nAverage Scores:")
        print(scores)
        
    except Exception as e:
        print(f"\nRagas Evaluation Failed: {e}")
        # print stack trace for debug
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_evaluation())
