import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:1323@localhost:5432/e_commerce"
    )
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "mysecretkey"
    )
    ALGORITHM: str = os.getenv(
        "ALGORITHM",
        "HS256"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    REDIS_URL: str = os.getenv(
        "REDIS_URL",
        "redis://localhost:6379/0"
    )
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        "static/uploads"
    )
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD", None)
    SMTP_FROM_EMAIL: str | None = os.getenv("SMTP_FROM_EMAIL", None)
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    HF_API_KEY: str = os.getenv("HF_API_KEY", "")

    # Gemini Fallback config
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)
    GEMINI_BASE_URL: str = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Mistral Fallback config
    MISTRAL_API_KEY: str | None = os.getenv("MISTRAL_API_KEY", None)
    MISTRAL_BASE_URL: str = os.getenv("MISTRAL_BASE_URL", "https://api.mistral.ai/v1")
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

    # CORS settings
    CORS_ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
        ).split(",") if origin.strip()
    ]

settings = Settings()
