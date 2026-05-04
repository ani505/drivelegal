from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DriveLegal"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/drivelegal"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/drivelegal"

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION_NAME: str = "drivelegal_laws"

    # AI / LLM
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "anthropic"  # anthropic | gemini

    # Geo
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    IPINFO_TOKEN: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # OCR
    TESSERACT_CMD: str = "/usr/bin/tesseract"

    # Feature Flags
    ENABLE_BLOCKCHAIN: bool = False
    ENABLE_COMPUTER_VISION: bool = False
    ENABLE_GAMIFICATION: bool = False

    # Blockchain (Polygon / Ethereum)
    ETHEREUM_RPC_URL: str = "https://polygon-rpc.com"
    WALLET_PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = ""
    PAYMENT_ESCROW_ADDRESS: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
