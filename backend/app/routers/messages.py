from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import List
from ..db import get_connection
from ..models import MessageCreate, Message
from ..services.vector_service import query_collection
from ..services.llm_service import ask_llm

router = APIRouter(prefix="/chats", tags=["messages"])

@router.post("/{chat_id}/messages", response_model=Message)
def send_message(chat_id: int, payload: MessageCreate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT collection_name FROM chats WHERE id = ?", (chat_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat not found.")
    collection_name = row["collection_name"]
    created_at = datetime.utcnow().isoformat()

    cur.execute(
        "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        (chat_id, "user", payload.question, created_at),
    )
    user_msg_id = cur.lastrowid
    conn.commit()

    top_chunks: List[str] = query_collection(collection_name, payload.question, k=4)
    answer = ask_llm(payload.question, top_chunks)

    cur.execute(
        "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        (chat_id, "assistant", answer, datetime.utcnow().isoformat()),
    )
    assistant_id = cur.lastrowid
    conn.commit()
    conn.close()

    return Message(
        id=assistant_id,
        chat_id=chat_id,
        role="assistant",
        content=answer,
    )
