from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from datetime import datetime
from ..db import get_connection
from ..models import Chat, ChatDetail, ChatCreate
from ..services.pdf_processing import save_pdf, extract_and_chunk
from ..services.embeddings_service import create_embeddings_for_chunks
from ..services.vector_service import store_chunks, get_or_create_collection

router = APIRouter(prefix="/chats", tags=["chats"])

def _collection_name(chat_id: int) -> str:
    return f"chat_{chat_id}_collection"

@router.get("/", response_model=List[Chat])
def list_chats():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM chats ORDER BY created_at DESC")
    rows = cur.fetchall()
    conn.close()
    return [Chat(id=row["id"], name=row["name"]) for row in rows]

@router.post("/", response_model=Chat)
def create_chat(chat: ChatCreate = ChatCreate()):
    conn = get_connection()
    cur = conn.cursor()
    name = chat.name or "New Chat"
    created_at = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO chats (name, collection_name, created_at) VALUES (?, ?, ?)",
        (name, "tmp", created_at),
    )
    chat_id = cur.lastrowid
    col_name = _collection_name(chat_id)
    cur.execute("UPDATE chats SET collection_name = ? WHERE id = ?", (col_name, chat_id))
    conn.commit()
    conn.close()
    get_or_create_collection(col_name)
    return Chat(id=chat_id, name=name)

@router.post("/{chat_id}/upload", response_model=Chat)
async def upload_pdf(chat_id: int, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    pdf_path = save_pdf(pdf_bytes, file.filename)
    chunks = extract_and_chunk(pdf_path)
    if not chunks:
        raise HTTPException(status_code=400, detail="No text found in PDF.")
    embeds = create_embeddings_for_chunks(chunks)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT collection_name, name FROM chats WHERE id = ?", (chat_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat not found.")
    col_name = row["collection_name"]
    name = row["name"]
    conn.close()

    store_chunks(col_name, chunks, embeds)
    return Chat(id=chat_id, name=name)

@router.get("/{chat_id}", response_model=ChatDetail)
def get_chat(chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM chats WHERE id = ?", (chat_id,))
    chat_row = cur.fetchone()
    if not chat_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat not found.")
    cur.execute(
        "SELECT id, chat_id, role, content, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
        (chat_id,),
    )
    msgs = cur.fetchall()
    conn.close()
    return ChatDetail(
        id=chat_row["id"],
        name=chat_row["name"],
        messages=[
            {
                "id": m["id"],
                "chat_id": m["chat_id"],
                "role": m["role"],
                "content": m["content"],
            }
            for m in msgs
        ],
    )

@router.patch("/{chat_id}", response_model=Chat)
def rename_chat(chat_id: int, chat: ChatCreate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE chats SET name = ? WHERE id = ?", (chat.name, chat_id))
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat not found.")
    conn.commit()
    conn.close()
    return Chat(id=chat_id, name=chat.name)

@router.delete("/{chat_id}")
def delete_chat(chat_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat not found.")
    conn.commit()
    conn.close()
    return {"ok": True}
