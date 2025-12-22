from fastapi import APIRouter, UploadFile, File, Form
from pathlib import Path
import shutil

from app.services.extract_text import extract_clean_text_from_pdf
from app.services.create_chunks import chunk_text_by_words

router = APIRouter()

UPLOAD_DIR = Path("app/data/uploads")

@router.post("/upload-pdf")
async def upload_pdf(
    chat_id: str = Form(...),
    file: UploadFile = File(...)
):
    # 1. Create folder for this chat
    chat_folder = UPLOAD_DIR / chat_id
    chat_folder.mkdir(parents=True, exist_ok=True)

    # 2. Save PDF
    pdf_path = chat_folder / file.filename
    with pdf_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"\n📄 PDF saved at: {pdf_path}")

    # 3. Extract text
    text = extract_clean_text_from_pdf(str(pdf_path))
    print("\n📝 Extracted Text (first 1000 chars):")
    print(text[:1000])

    # 4. Create chunks
    chunks = chunk_text_by_words(text)
    print(f"\n📦 Total Chunks Created: {len(chunks)}\n")

    for i, chunk in enumerate(chunks[:5]):
        print(f"--- Chunk {i+1} ---")
        print(chunk[:500])
        print()

    return {
        "status": "success",
        "chat_id": chat_id,
        "num_chunks": len(chunks)
    }
