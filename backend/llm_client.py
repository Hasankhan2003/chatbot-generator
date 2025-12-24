# llm_client.py
import os
from typing import List
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set. Put it in your .env file.")


def get_groq_client() -> Groq:
    """
    Return a Groq client using the API key from environment.
    """
    client = Groq(api_key=GROQ_API_KEY)
    return client


def build_context_from_chunks(chunks: List[str], max_chars: int = 3500) -> str:
    """
    Join top retrieved chunks into a single context string
    (truncating to avoid huge prompts).
    """
    context_parts = []
    total_len = 0
    for chunk in chunks:
        if total_len + len(chunk) > max_chars:
            break
        context_parts.append(chunk)
        total_len += len(chunk)
    return "\n\n---\n\n".join(context_parts)


def ask_groq_llm(question: str, context_chunks: List[str]) -> str:
    """
    Call a Groq LLM with the user question and retrieved context.
    """
    client = get_groq_client()

    context = build_context_from_chunks(context_chunks)

    system_prompt = (
        "You are a helpful assistant that answers questions "
        "using only the provided context.\n"
        "If the answer is not in the context, say you don't know."
    )

    user_content = (
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        f"Answer in a concise way."
    )

    # Use a suitable fast model, e.g. llama-3
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",  # adjust to any Groq-supported model you like
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
    )

    return completion.choices[0].message.content
