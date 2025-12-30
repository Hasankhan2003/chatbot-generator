from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.chat import ChatCreate, ChatRead
from app.services.chat_service import create_chat, update_chat, delete_chat
from app.models.chat import Chat

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.post("", response_model=ChatRead)
def create(chat: ChatCreate, db: Session = Depends(get_db)):
    return create_chat(db, chat.title)


@router.get("", response_model=list[ChatRead])
def list_chats(db: Session = Depends(get_db)):
    return db.query(Chat).order_by(Chat.updated_at.desc()).all()


@router.put("/{chat_id}", response_model=ChatRead)
def update(chat_id: int, chat: ChatCreate, db: Session = Depends(get_db)):
    """Update chat title."""
    return update_chat(db, chat_id, chat.title)


@router.delete("/{chat_id}", status_code=204)
def delete(chat_id: int, db: Session = Depends(get_db)):
    """Delete a chat and its messages."""
    delete_chat(db, chat_id)
    return None
