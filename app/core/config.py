"""Configuration management"""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@postgres:5432/appdb")
    read_only_db_user: bool = os.getenv("READ_ONLY_DB_USER", "true").lower() == "true"
    
    # Model
    model_mode: str = os.getenv("MODEL_MODE", "openai")  # openai or local
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    model_path: str = os.getenv("MODEL_PATH", "./models/t5-small")
    
    # Execution
    max_execution_ms: int = int(os.getenv("MAX_EXECUTION_MS", "10000"))
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # Redis (optional)
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
