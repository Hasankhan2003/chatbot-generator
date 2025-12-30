from pydantic import BaseModel
from datetime import datetime


class ChatCreate(BaseModel):
    title: str | None = None


class ChatRead(BaseModel):
    id: int
    title: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
