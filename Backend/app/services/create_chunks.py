from typing import List

def chunk_text_by_words(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 200,
) -> List[str]:
    """
    Split text into overlapping chunks, trying to respect word boundaries.

    chunk_size / overlap are approximate character targets, but chunks are cut
    on word boundaries so they don't split words in the middle.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if overlap < 0:
        raise ValueError("overlap must be >= 0")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    words = text.split()  # split on whitespace, words stay intact
    chunks: List[str] = []
    if not words:
        return chunks

    current_words: List[str] = []
    current_len = 0

    # Convert overlap from characters to a rough number of words
    # (assuming average 6 chars per word incl. space; adjust if needed)
    avg_word_len = 6
    target_chunk_words = max(1, chunk_size // avg_word_len)
    target_overlap_words = max(0, overlap // avg_word_len)

    i = 0
    n = len(words)

    while i < n:
        current_words = []
        current_len = 0

        # Build a chunk up to approx chunk_size characters
        while i < n and current_len < chunk_size:
            w = words[i]
            current_words.append(w)
            # +1 for space
            current_len += len(w) + 1
            i += 1

        chunk = " ".join(current_words).strip()
        if not chunk:
            break
        chunks.append(chunk)

        if i >= n:
            break

        # Move back by overlap_words for next chunk start (word-based overlap)
        overlap_words = min(target_overlap_words, len(current_words) - 1)
        i = max(0, i - overlap_words)

    return chunks
