# embeddings.py
from typing import List
from sentence_transformers import SentenceTransformer  # pip install sentence-transformers

# Use a lightweight, fast model
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Cache the model globally so it is loaded only once
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """
    Lazily load and return the global SentenceTransformer model instance.
    """
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def create_embeddings(chunks: List[str]) -> List[list[float]]:
    """
    Encode a list of text chunks into embeddings (list of float vectors).
    """
    if not chunks:
        return []

    model = get_model()
    # Returns a numpy array; convert to plain Python lists if you later want to JSON-serialize
    embeddings = model.encode(chunks, batch_size=32, show_progress_bar=True)
    return embeddings.tolist()
