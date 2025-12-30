from groq import Groq
from app.core.config import settings


client = Groq(api_key=settings.GROQ_API_KEY)


def call_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful document QA assistant."},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content
