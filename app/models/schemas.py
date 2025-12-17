from pydantic import BaseModel
from typing import List, Optional

class QueryRequest(BaseModel):
    text: str
    session_id: Optional[str] = None

class Citation(BaseModel):
    content: str
    metadata: dict

class QueryResponse(BaseModel):
    answer: str
    source: str
    model_used: str
    latency: float
    citations: List[Citation] = []
