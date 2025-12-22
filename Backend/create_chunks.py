# create_chunks.py

from typing import List


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> List[str]:
    """
    Split text into fixed-size overlapping chunks (character-based).

    Args:
        text: The full cleaned text.
        chunk_size: Target size of each chunk (in characters).
        overlap: Number of characters to overlap between consecutive chunks.

    Returns:
        List of chunk strings.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if overlap < 0:
        raise ValueError("overlap must be >= 0")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []
    start = 0
    text_length = len(text)

    step = chunk_size - overlap

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= text_length:
            break
        start += step

    return chunks
