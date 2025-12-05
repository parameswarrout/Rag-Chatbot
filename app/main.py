from fastapi import FastAPI
from app.core.config import settings
from app.api import routes

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

app.include_router(routes.router)

@app.get("/")
async def root():
    return {"message": "RAG Orchestration Agent is running"}
