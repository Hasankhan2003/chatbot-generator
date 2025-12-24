from typing import List
from backend import embeddings

def create_embeddings_for_chunks(chunks: List[str]) -> List[list[float]]:
    return embeddings.create_embeddings(chunks)
