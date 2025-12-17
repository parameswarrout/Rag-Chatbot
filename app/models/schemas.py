from pydantic import BaseModel
from typing import List, Optional, Literal

class QueryRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    mode: Literal["fast", "simple", "advanced"] = "advanced"

class Citation(BaseModel):
    content: str
    metadata: dict

class QueryResponse(BaseModel):
    answer: str
    source: str
    model_used: str
    latency: float
    citations: List[Citation] = []
    metadata: dict | None = None

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatStreamRequest(BaseModel):
    messages: list[Message]
    mode: Literal["fast", "simple", "advanced"] = "advanced"
    stream: bool = True
