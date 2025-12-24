from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import init_db
from .routers import chats, messages

app = FastAPI(title="Chatbot Generator")

origins = ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:8000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(chats.router)
app.include_router(messages.router)

@app.get("/health")
def health():
    return {"status": "ok"}
