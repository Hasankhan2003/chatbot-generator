from pathlib import Path
from datetime import datetime
from typing import List
from ..core.config import UPLOAD_DIR

from backend import extract_text
from backend import create_chunks

def save_pdf(file_bytes: bytes, filename: str) -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_name = f"{ts}_{filename}"
    path = UPLOAD_DIR / safe_name
    with open(path, "wb") as f:
        f.write(file_bytes)
    return str(path)

def extract_and_chunk(pdf_path: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    text = extract_text.extract_clean_text_from_pdf(pdf_path)
    chunks = create_chunks.chunk_text_by_words(text, chunk_size=chunk_size, overlap=overlap)
    return chunks
