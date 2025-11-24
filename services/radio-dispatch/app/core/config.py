"""Configuration settings for Radio Dispatch Service."""

from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    APP_NAME: str = "Radio Dispatch Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "https://fleet.capitaltechalliance.com"])

    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_POOL_SIZE: int = 10

    # Celery
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2")

    # Azure Speech Service
    AZURE_SPEECH_KEY: str = Field(..., description="Azure Cognitive Services Speech API key")
    AZURE_SPEECH_REGION: str = Field(default="eastus")
    AZURE_SPEECH_LANGUAGE: str = Field(default="en-US")

    # Azure Blob Storage (for audio files)
    AZURE_STORAGE_CONNECTION_STRING: str = Field(..., description="Azure Storage connection string")
    AZURE_STORAGE_CONTAINER: str = Field(default="radio-audio")

    # Azure Key Vault (optional)
    AZURE_KEY_VAULT_URL: Optional[str] = None

    # AI Services
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Fleet API Integration
    FLEET_API_BASE_URL: str = Field(default="http://localhost:5000/api")
    FLEET_API_KEY: Optional[str] = None

    # Socket.IO
    SOCKETIO_ASYNC_MODE: str = "asgi"
    SOCKETIO_CORS_ALLOWED_ORIGINS: str = "*"

    # Processing Settings
    MAX_AUDIO_DURATION_SECONDS: int = 300  # 5 minutes
    TRANSCRIPTION_CONFIDENCE_THRESHOLD: float = 0.70
    ENTITY_EXTRACTION_MODEL: str = "en_core_web_sm"

    # Policy Engine
    DEFAULT_OPERATING_MODE: str = "hitl"  # monitor_only, hitl, autonomous
    POLICY_EXECUTION_TIMEOUT_SECONDS: int = 30

    # Security
    JWT_SECRET_KEY: str = Field(..., description="JWT secret key")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # Monitoring
    ENABLE_PROMETHEUS: bool = True
    ENABLE_OPENTELEMETRY: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


# Global settings instance
settings = Settings()
