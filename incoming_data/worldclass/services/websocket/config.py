"""
Configuration management for WebSocket service.
"""
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class WebSocketSettings(BaseSettings):
    """WebSocket service configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Service
    websocket_port: int = Field(default=8001, description="WebSocket service port")
    mode: str = Field(default="development", pattern="^(development|staging|production)$")
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")

    # JWT Authentication
    jwt_secret: str = Field(..., description="Secret key for JWT verification")
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")

    # Kafka
    kafka_bootstrap_servers: str = Field(
        default="localhost:9092",
        description="Kafka bootstrap servers (comma-separated)"
    )
    kafka_consumer_group: str = Field(
        default="websocket-service",
        description="Kafka consumer group ID"
    )
    kafka_topics: str = Field(
        default="radio.events.transmission,radio.events.transcription,radio.events.incident,radio.events.task,radio.events.asset,radio.events.alert",
        description="Kafka topics to consume (comma-separated)"
    )

    @validator("kafka_topics")
    def parse_kafka_topics(cls, v: str) -> List[str]:
        """Parse comma-separated Kafka topics."""
        return [topic.strip() for topic in v.split(",") if topic.strip()]

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    redis_session_ttl: int = Field(
        default=3600,
        description="Session TTL in Redis (seconds)"
    )

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Allowed CORS origins (comma-separated)"
    )

    @validator("cors_origins")
    def parse_cors_origins(cls, v: str) -> List[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    # WebSocket Configuration
    ping_interval: int = Field(
        default=25,
        description="Ping interval in seconds"
    )
    ping_timeout: int = Field(
        default=60,
        description="Ping timeout in seconds"
    )
    max_http_buffer_size: int = Field(
        default=1024 * 1024,  # 1MB
        description="Maximum HTTP buffer size in bytes"
    )

    # Connection Limits
    max_connections_per_organization: Optional[int] = Field(
        default=None,
        description="Maximum WebSocket connections per organization (None = unlimited)"
    )
    max_connections_per_user: Optional[int] = Field(
        default=None,
        description="Maximum WebSocket connections per user (None = unlimited)"
    )

    # Rate Limiting
    enable_rate_limiting: bool = Field(
        default=False,
        description="Enable rate limiting for events"
    )
    rate_limit_messages_per_minute: int = Field(
        default=1000,
        description="Max messages per minute per connection"
    )

    # OpenTelemetry (optional)
    otel_exporter_otlp_endpoint: Optional[str] = Field(
        default=None,
        description="OpenTelemetry OTLP exporter endpoint"
    )
    otel_service_name: str = Field(
        default="radio-fleet-websocket",
        description="OpenTelemetry service name"
    )
    otel_traces_sampler: str = Field(
        default="parentbased_traceidratio",
        description="OpenTelemetry traces sampler"
    )
    otel_traces_sampler_arg: float = Field(
        default=0.1,
        description="OpenTelemetry traces sampler argument"
    )

    # Azure Application Insights (optional)
    applicationinsights_connection_string: Optional[str] = Field(
        default=None,
        description="Azure Application Insights connection string"
    )

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.mode == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.mode == "development"


# Singleton settings instance
settings = WebSocketSettings()
