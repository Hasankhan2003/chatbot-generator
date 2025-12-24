from typing import List
from backend import llm_client

def ask_llm(question: str, context_chunks: List[str]) -> str:
    return llm_client.ask_groq_llm(question, context_chunks)
