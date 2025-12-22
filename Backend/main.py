# main.py

from extract_text import extract_clean_text_from_pdf
from create_chunks import chunk_text_by_words


def main():

    PDF_PATH = "monopoly.pdf"  # Replace with your PDF file path
    clean_text = extract_clean_text_from_pdf(PDF_PATH)

    chunks = chunk_text_by_words(
        clean_text,
        chunk_size=1000,   # target chars per chunk
        overlap=200,       # target overlapping chars
    )

    print(f"Total characters: {len(clean_text)}")
    print(f"Total chunks: {len(chunks)}\n")

    for i, chunk in enumerate(chunks[:3], start=1):
        print(f"=== Chunk {i} ===")
        print(chunk)
        print("\n" + "-" * 80 + "\n")


if __name__ == "__main__":
    main()
