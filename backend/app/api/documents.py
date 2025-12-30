from fastapi import APIRouter, UploadFile, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.document_service import ingest_pdf
from app.schemas.document import DocumentRead

router = APIRouter(prefix="/chats/{chat_id}/documents", tags=["Documents"])


@router.post("", response_model=DocumentRead)
def upload(chat_id: int, file: UploadFile, db: Session = Depends(get_db)):
    return ingest_pdf(db, chat_id, file)
