from pydantic import BaseModel

class QueryRequest(BaseModel):
    text: str

class QueryResponse(BaseModel):
    answer: str
    source: str
    model_used: str
    latency: float
