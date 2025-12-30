from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chats, documents, messages
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chatbot Generator")

# CORS configuration
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    # add more origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] to allow all (see note below)
    allow_credentials=True,
    allow_methods=["*"],          # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],          # Authorization, Content-Type, etc.
)

app.include_router(chats.router)
app.include_router(documents.router)
app.include_router(messages.router)
