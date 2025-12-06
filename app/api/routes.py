from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from app.models.schemas import QueryRequest, QueryResponse
from app.containers import container, Container
from app.services.chat_service import ChatService
from app.core.logging import logger

router = APIRouter()

def get_chat_service():
    """Dependency provider for ChatService"""
    return ChatService(container.llm_router, container.retriever)

@router.get("/health", status_code=200)
async def health_check():
    logger.debug("Health check requested.")
    return {"status": "ok"}

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
