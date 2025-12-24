from typing import List, Optional
from pydantic import BaseModel

class ChatCreate(BaseModel):
    name: Optional[str] = None

class Chat(BaseModel):
    id: int
    name: str

class MessageCreate(BaseModel):
    question: str

class Message(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str

class ChatDetail(BaseModel):
    id: int
    name: str
    messages: List[Message]
