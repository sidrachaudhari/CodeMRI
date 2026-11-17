import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Ensure backend/.env is located reliably
BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeMRI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://placeholder:placeholder@localhost/codemri"
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 300

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        return ["*"]

    # Authentication & Security
    # CodeMRI uses external authentication (e.g. Neon Auth / Clerk / Auth0 / Supabase)
    AUTH_PROVIDER_DEFAULT: str = "neon_auth"
    # Optional shared secret or public key for validating JWTs when configured
    AUTH_JWT_SECRET: str = os.getenv("AUTH_JWT_SECRET", "")
    AUTH_JWT_ALGORITHM: str = "HS256"

    # pgvector embedding dimensions (e.g. 768 for nomic/text-embedding, 1536 for OpenAI)
    CODEMRI_EMBEDDING_DIMENSIONS: int = int(os.getenv("CODEMRI_EMBEDDING_DIMENSIONS", "768"))

    # Google Gemini AI Studio
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_THINKING_LEVEL: str = os.getenv("GEMINI_THINKING_LEVEL", "medium")

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
