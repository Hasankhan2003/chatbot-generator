# vector_store.py
from typing import List, Optional
import chromadb


def get_chroma_client(persist_directory: str = "./chroma_db") -> chromadb.Client:
    client = chromadb.PersistentClient(path=persist_directory)
    return client


def get_or_create_collection(
    client: chromadb.Client,
    name: str = "documents",
):
    collection = client.get_or_create_collection(name=name)
    return collection


def store_embeddings_in_chromadb(
    collection,
    chunks: List[str],
    embeddings: List[List[float]],
    metadatas: Optional[List[dict]] = None,
):
    if len(chunks) != len(embeddings):
        raise ValueError("chunks and embeddings must have the same length")

    ids = [f"doc_{i}" for i in range(len(chunks))]

    # Chroma now expects each metadata dict to be non-empty.
    if metadatas is None:
        metadatas = [
            {
                "source": "pdf",
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ]
    else:
        # Make sure no metadata dict is empty
        fixed = []
        for i, md in enumerate(metadatas):
            if not md:
                md = {"chunk_index": i}
            fixed.append(md)
        metadatas = fixed

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return ids

def query_chromadb(
    collection,
    question: str,
    n_results: int = 4,
) -> List[str]:
    """
    Query the Chroma collection and return top document chunks.
    """
    results = collection.query(
        query_texts=[question],
        n_results=n_results,
    )
    # results["documents"] is a list of lists
    docs = results["documents"][0] if results["documents"] else []
    return docs