from pydantic import BaseModel
from datetime import datetime


class DocumentRead(BaseModel):
    id: int
    chat_id: int
    filename: str
    status: str
    num_chunks: int
    created_at: datetime

    class Config:
        from_attributes = True
