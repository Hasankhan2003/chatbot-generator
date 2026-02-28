# Chatbot Generator 

A small document-QA chat app that lets you upload PDFs and ask questions about them. The backend is built with FastAPI and uses ChromaDB for vector storage and SentenceTransformers for embeddings. The frontend is a lightweight static HTML/JS app that talks to the backend API.

---

##  Features

- Upload PDFs and extract text
- Chunking + embeddings for retrieval
- Persistent vector store (Chroma)
- LLM-based answers (Groq integration)
- Per-chat document and message management
- Simple static frontend

---

## Tech stack

- Backend: FastAPI, SQLAlchemy
- Vector DB: ChromaDB (chromadb)
- Embeddings: sentence-transformers
- LLM: Groq (via `groq` Python client)
- Frontend: Static HTML/CSS/JS

---

## Requirements

- Python 3.10+ (create a virtual environment recommended)
- `pip install -r backend/requirements.txt`
- No Node tooling required to run the frontend (it is static)

---

## Configuration

The backend reads settings from a `.env` file (Pydantic `BaseSettings`). Example `.env` (place at `backend/.env` or run the server from the `backend/` dir):

```env
APP_NAME=ChatbotGenerator
ENV=development
DATABASE_URL=sqlite:///./sqlite.db
CHROMA_PERSIST_DIR=./data/chroma
CHROMA_COLLECTION=default
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=gpt-xyz
UPLOAD_DIR=./uploads
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

Important env keys:
- `DATABASE_URL` — SQLAlchemy connection string (e.g. SQLite for local dev)
- `CHROMA_PERSIST_DIR` — directory for ChromaDB persistence
- `EMBEDDING_MODEL` — sentence-transformers model name
- `GROQ_API_KEY` / `GROQ_MODEL` — Groq LLM credentials

---

## Run locally

Backend

```bash
cd backend
python -m venv .venv
# Windows example
.\.venv\Scripts\activate
pip install -r requirements.txt
# Start the server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend

Run the static frontend by starting a simple HTTP server and visiting the URL:

```bash
cd frontend
python -m http.server 5500 --bind 127.0.0.1
# then open http://127.0.0.1:5500/index.html

# Start the backend server separately:
# (run this in the backend/ directory)
# python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

```# Quick server
python -m http.server 5500 --bind 127.0.0.1
# then open http://127.0.0.1:5500/index.html
```

> The backend CORS allows `http://127.0.0.1:5500` and `http://localhost:5500` by default.

---

## API Reference (quick)

- POST `/chats`  — Create a chat
  - Body: `{ "title": "My chat" }`
- GET `/chats` — List chats
- PUT `/chats/{chat_id}` — Update chat title
- DELETE `/chats/{chat_id}` — Delete a chat
- POST `/chats/{chat_id}/documents` — Upload a PDF (`multipart/form-data`, field `file`)
- POST `/chats/{chat_id}/ask` — Ask a question
  - Body: `{ "message": "...", "max_chunks": 5 }`
  - Response: `{ "answer": "...", "message_id": 123, "sources": [...] }`
- GET `/chats/{chat_id}/messages` — List messages for a chat


---

## Data storage details

- Uploaded PDFs are stored under `UPLOAD_DIR` in subfolders `chat_{chat_id}` (e.g. `uploads/chat_1/doc_1.pdf`).
- ChromaDB persistence is controlled by `CHROMA_PERSIST_DIR`.
- SQL DB is configured with `DATABASE_URL` (default commonly SQLite for development).

---




