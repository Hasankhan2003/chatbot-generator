from extract_text import extract_clean_text_from_pdf
from create_chunks import chunk_text_by_words
from embeddings import create_embeddings
from vector_store import (
    get_chroma_client,
    get_or_create_collection,
    store_embeddings_in_chromadb,
    query_chromadb,
)
from llm_client import ask_groq_llm


def main():
    # 1) Path to your PDF
    pdf_path = "monopoly.pdf"  # change this

    # 2) Extract text
    text = extract_clean_text_from_pdf(pdf_path)

    # 3) Create chunks
    chunks = chunk_text_by_words(
        text,
        chunk_size=1000,
        overlap=200,
    )
    print(f"Total chunks: {len(chunks)}")

    # 4) Create embeddings
    embeddings = create_embeddings(chunks)
    print(f"Created embeddings for {len(embeddings)} chunks")

    # 5) Init ChromaDB
    client = get_chroma_client(persist_directory="./chroma_db")
    collection = get_or_create_collection(client, name="monopoly_manual")

    # 6) Store embeddings
    ids = store_embeddings_in_chromadb(collection, chunks, embeddings)
    print(f"Stored {len(ids)} items in ChromaDB collection 'monopoly_manual'")

    # 7) Demo question
    question = "What is the objective of the game?"
    top_chunks = query_chromadb(collection, question, n_results=4)

    print("\nRetrieved context chunks:")
    for i, c in enumerate(top_chunks, start=1):
        print(f"\n--- Chunk {i} ---\n{c[:250]}...")

    # 8) Ask Groq LLM
    answer = ask_groq_llm(question, top_chunks)

    print("\nLLM answer:\n")
    print(answer)


if __name__ == "__main__":
    main()
