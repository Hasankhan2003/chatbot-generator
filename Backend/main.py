# main.py

from extract_text import extract_clean_text_from_pdf
from create_chunks import chunk_text


def main():

    PDF_PATH = "report.pdf"  # specify your PDF path here

    # 1. Extract cleaned text from the PDF
    clean_text = extract_clean_text_from_pdf(PDF_PATH)

    # 2. Chunk the text
    chunks = chunk_text(
        clean_text,
        chunk_size=1000,   # adjust for your model / use case
        overlap=200,       # typically 10–20% of chunk_size
    )

    # 3. Example: print basic info and first few chunks
    print(f"Total characters: {len(clean_text)}")
    print(f"Total chunks: {len(chunks)}\n")

    for i, chunk in enumerate(chunks[:3], start=1):
        print(f"=== Chunk {i} ===")
        print(chunk)
        print("\n" + "-" * 80 + "\n")


if __name__ == "__main__":
    main()
