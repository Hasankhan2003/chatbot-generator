from sqlalchemy.orm import Session
from app.models.message import Message
from app.core.chroma import collection
from app.core.llm import call_llm
from app.utils.embeddings import embed_texts


def ask_question(db: Session, chat_id: int, question: str, k: int):
    user_msg = Message(chat_id=chat_id, role="user", content=question)
    db.add(user_msg)
    db.commit()

    q_embedding = embed_texts([question])[0]

    result = collection.query(
        query_embeddings=[q_embedding],
        n_results=k,
        where={"chat_id": chat_id},
    )

    context = "\n\n".join(result["documents"][0])
    prompt = f"Context:\n{context}\n\nQuestion:\n{question}"

    answer = call_llm(prompt)

    assistant_msg = Message(chat_id=chat_id, role="assistant", content=answer)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return answer, assistant_msg.id, result["metadatas"][0]
