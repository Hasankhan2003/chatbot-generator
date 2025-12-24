from typing import List
from backend import vector_store
from ..core.config import PERSIST_DIR

_client = None

def get_client():
    global _client
    if _client is None:
        _client = vector_store.get_chroma_client(PERSIST_DIR)
    return _client

def get_or_create_collection(name: str):
    client = get_client()
    return vector_store.get_or_create_collection(client, name=name)

def store_chunks(collection_name: str, chunks: List[str], embeds: List[list[float]]):
    col = get_or_create_collection(collection_name)
    return vector_store.store_embeddings_in_chromadb(col, chunks, embeds)

def query_collection(collection_name: str, question: str, k: int = 4) -> List[str]:
    col = get_or_create_collection(collection_name)
    return vector_store.query_chromadb(col, question, n_results=k) 
