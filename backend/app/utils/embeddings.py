from sentence_transformers import SentenceTransformer
from app.core.config import settings


_model = SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_texts(texts: list[str]) -> list[list[float]]:
    return _model.encode(texts, convert_to_numpy=True).tolist()
