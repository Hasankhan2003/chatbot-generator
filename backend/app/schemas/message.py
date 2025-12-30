from pydantic import BaseModel
from datetime import datetime


class MessageRead(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class AskRequest(BaseModel):
    message: str
    max_chunks: int = 5
