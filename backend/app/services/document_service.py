import uuid
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.document import Document
from app.core.config import settings
from app.core.chroma import collection
from app.utils.pdf import extract_clean_text_from_pdf
from app.utils.chunking import chunk_text
from app.utils.embeddings import embed_texts


def ingest_pdf(db: Session, chat_id: int, file):
    upload_dir = Path(settings.UPLOAD_DIR) / f"chat_{chat_id}"
    upload_dir.mkdir(parents=True, exist_ok=True)

    doc = Document(
        chat_id=chat_id,
        filename=file.filename,
        status="uploaded",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    path = upload_dir / f"doc_{doc.id}.pdf"
    path.write_bytes(file.file.read())

    doc.storage_path = str(path)

    text = extract_clean_text_from_pdf(path)
    chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
    embeddings = embed_texts(chunks)

    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [
        {
            "chat_id": chat_id,
            "document_id": doc.id,
            "chunk_index": i,
            "source": doc.storage_path,
        }
        for i in range(len(chunks))
    ]

    collection.add(
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    doc.status = "processed"
    doc.num_chunks = len(chunks)
    db.commit()
    return doc
