from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.message import AskRequest, MessageRead
from app.services.message_service import ask_question
from app.models.message import Message

router = APIRouter(prefix="/chats/{chat_id}", tags=["Messages"])


@router.post("/ask")
def ask(chat_id: int, body: AskRequest, db: Session = Depends(get_db)):
    answer, msg_id, sources = ask_question(
        db, chat_id, body.message, body.max_chunks
    )
    return {
        "answer": answer,
        "message_id": msg_id,
        "sources": sources,
    }


@router.get("/messages", response_model=list[MessageRead])
def list_messages(chat_id: int, db: Session = Depends(get_db)):
    """Return all messages for a chat ordered by creation time."""
    return db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()
