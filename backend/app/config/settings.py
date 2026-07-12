import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

class Settings:
    APP_NAME: str = "Smart City Services API"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///:memory:")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    CORS_ORIGINS: list[str] = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080").split(",") if origin.strip()]
    FIREBASE_CREDENTIALS_JSON: str = os.getenv("FIREBASE_CREDENTIALS_JSON", "")

settings = Settings()
