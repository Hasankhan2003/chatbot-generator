from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str
    ENV: str

    DATABASE_URL: str

    CHROMA_PERSIST_DIR: str
    CHROMA_COLLECTION: str

    EMBEDDING_MODEL: str

    GROQ_API_KEY: str
    GROQ_MODEL: str

    UPLOAD_DIR: str

    CHUNK_SIZE: int
    CHUNK_OVERLAP: int

    class Config:
        env_file = ".env"


settings = Settings()
