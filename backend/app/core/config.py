from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

PERSIST_DIR = str(BASE_DIR.parent / "chromadb_data")
UPLOAD_DIR = BASE_DIR.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

DB_PATH = BASE_DIR.parent / "chatbot.db"
GROQ_MODEL = "llama-3.1-8b-instant"
