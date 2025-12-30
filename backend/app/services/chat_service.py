from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.chat import Chat


def create_chat(db: Session, title: str | None):
    chat = Chat(title=title or "New Chat")
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def update_chat(db: Session, chat_id: int, title: str | None):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if title is not None:
        chat.title = title
    db.commit()
    db.refresh(chat)
    return chat


def delete_chat(db: Session, chat_id: int):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(chat)
    db.commit()
    return None
