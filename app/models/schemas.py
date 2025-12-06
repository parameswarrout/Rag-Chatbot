from pydantic import BaseModel

from typing import Literal

class QueryRequest(BaseModel):
    text: str
    mode: Literal["fast", "simple", "advanced"] = "advanced"

class QueryResponse(BaseModel):
    answer: str
    source: str
    model_used: str
    latency: float
    citations: list[str] = []
    metadata: dict | None = None

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatStreamRequest(BaseModel):
    messages: list[Message]
    mode: Literal["fast", "simple", "advanced"] = "advanced"
    stream: bool = True
