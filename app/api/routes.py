from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, UploadFile, File, Form
from app.models.schemas import QueryRequest, QueryResponse
from app.containers import container, Container
from app.services.chat_service import ChatService
from app.core.logging import logger
import shutil
import os

router = APIRouter()

def get_chat_service():
    """Dependency provider for ChatService"""
    return ChatService(container.llm_router, container.retriever)

import httpx
from app.core.config import settings

@router.get("/health", status_code=200)
async def health_check():
    logger.debug("Health check requested.")
    
    ollama_status = "offline"
    try:
        # Base URL usually http://localhost:11434/v1, we want root
        base_url = settings.LOCAL_LLM_URL.replace("/v1", "").rstrip("/")
        async with httpx.AsyncClient(timeout=httpx.Timeout(timeout=2.0)) as client:
            res = await client.get(f"{base_url}/api/tags")
            if res.status_code == 200:
                ollama_status = "online"
    except Exception:
        pass
        
    return {"status": "ok", "ollama": ollama_status}

def ingest_data_task():
    """Background task to load and index data."""
    logger.info("Starting data ingestion task...")
    try:
        loader = container.document_loader
        documents = loader.load_documents()

        if not documents:
            logger.warning("No documents found in data/ directory.")
            return

        chunker = container.semantic_chunker
        chunked_docs = chunker.chunk_documents(documents)

        container.retriever.index_documents(chunked_docs)
        logger.info(f"Indexed {len(chunked_docs)} chunks successfully.")
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")

@router.post("/upload", status_code=200)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    file_type: str = Form(...)
):
    """
    Upload a file and trigger ingestion.
    file_type: 'pdf', 'word', or 'text'
    """
    try:
        # Validate file type
        valid_types = ["pdf", "word", "text"]
        if file_type not in valid_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Must be pdf, word, or text.")

        # Determine save directory
        save_dir = f"data/{file_type}"
        os.makedirs(save_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(save_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File uploaded successfully to {file_path}")

        # Trigger ingestion
        background_tasks.add_task(ingest_data_task)
        
        return {"message": f"File uploaded and ingestion started.", "filename": file.filename}

    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/reset", status_code=200)
async def reset_knowledge_base():
    """Clear the vector database and reset the retriever."""
    try:
        container.retriever.clear_index()
        logger.info("Knowledge base cleared upon user request.")
        return {"message": "Knowledge base cleared successfully."}
    except Exception as e:
         logger.error(f"Reset failed: {e}")
         raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@router.post("/ingest", status_code=202)
async def ingest_data(background_tasks: BackgroundTasks):
    """Trigger data ingestion in the background."""
    try:
        background_tasks.add_task(ingest_data_task)
        return {"message": "Ingestion started in background"}
    except Exception as e:
        logger.error(f"Failed to trigger ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger ingestion: {str(e)}")

@router.post("/query", response_model=QueryResponse, status_code=200)
async def query_llm(
    request: QueryRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    try:
        return await chat_service.process_query(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in query_llm: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
from app.models.schemas import ChatStreamRequest

@router.post("/chat", status_code=200)
async def chat_stream(
    request: ChatStreamRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Streaming chat endpoint with history support.
    """
    return StreamingResponse(
        chat_service.stream_chat(request), 
        media_type="text/event-stream"
    )

@router.get("/sessions", status_code=200)
async def get_sessions(chat_service: ChatService = Depends(get_chat_service)):
    """List all active session IDs."""
    return {"sessions": chat_service.memory_manager.get_all_sessions()}

@router.get("/sessions/{session_id}", status_code=200)
async def get_session_history(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Get history for a specific session."""
    history = chat_service.memory_manager.get_raw_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"history": history}

@router.delete("/sessions", status_code=200)
async def clear_all_sessions(chat_service: ChatService = Depends(get_chat_service)):
    """Clear all sessions history."""
    try:
        chat_service.clear_all_sessions()
        return {"message": "All sessions cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear sessions")

@router.get("/models", status_code=200)
async def get_models():
    base_url = settings.LOCAL_LLM_URL.replace("/v1", "").rstrip("/")
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(timeout=30.0)
        ) as client:
            res = await client.get(f"{base_url}/api/tags")
            res.raise_for_status()
            data = res.json()
            return {
                "count": len(data.get("models", [])),
                "models": data.get("models", [])
            }
    except httpx.RequestError as e:
        logger.error(f"Ollama not reachable: {e}")
        raise HTTPException(503, "Ollama service unavailable")
    except Exception as e:
        logger.exception("Failed to list Ollama models")
        raise HTTPException(500, "Failed to fetch models")



from app.models.schemas import ModelPullRequest

@router.post("/models/pull", status_code=200)
async def pull_model(request: ModelPullRequest):
    base_url = settings.LOCAL_LLM_URL.replace("/v1", "").rstrip("/")

    async def stream_pull():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{base_url}/api/pull",
                    json={"name": request.name}
                ) as response:
                    if response.status_code != 200:
                        error = await response.aread()
                        yield f"data: {{\"error\": \"{error.decode()}\"}}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if line:
                            yield f"data: {line}\n\n"

        except asyncio.CancelledError:
            logger.info("Client disconnected during model pull")
            return
        except Exception as e:
            logger.exception("Ollama model pull failed")
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"

    return StreamingResponse(
        stream_pull(),
        media_type="text/event-stream"
    )



import asyncio
from app.models.schemas import ModelDeleteRequest

@router.delete("/models", status_code=200)
async def delete_model(request: ModelDeleteRequest):
    base_url = settings.LOCAL_LLM_URL.replace("/v1", "").rstrip("/")

    if ":" not in request.name:
        raise HTTPException(400, "Model name must include tag (e.g. llama3:latest)")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.request(
                "DELETE",
                f"{base_url}/api/delete",
                json={"name": request.name}
            )

            if res.status_code == 200:
                return {"message": f"Model {request.name} deleted successfully"}

            if res.status_code == 404:
                raise HTTPException(404, "Model not found")

            logger.error(f"Ollama delete failed: {res.text}")
            raise HTTPException(res.status_code, res.text)

    except httpx.RequestError as e:
        logger.error(f"Ollama unreachable: {e}")
        raise HTTPException(503, "Ollama service unavailable")



