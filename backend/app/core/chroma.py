import chromadb
from app.core.config import settings

client = chromadb.PersistentClient(
    path=settings.CHROMA_PERSIST_DIR
)

collection = client.get_or_create_collection(
    name=settings.CHROMA_COLLECTION
)
