"""
Webhook management schemas.

Security:
- URL validation
- Event whitelist
- Secret validation
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string, validate_url


class WebhookCreate(BaseSchema):
    """Webhook creation request."""

    url: str = Field(..., max_length=500, description="Webhook endpoint URL")
    secret: str = Field(
        ..., min_length=32, max_length=255, description="HMAC signing secret"
    )
    events: List[str] = Field(..., min_items=1, description="Subscribed event types")
    retry_count: int = Field(default=3, ge=0, le=10, description="Max retry attempts")
    timeout_ms: int = Field(
        default=10000, ge=1000, le=60000, description="Request timeout in milliseconds"
    )

    @field_validator("url")
    @classmethod
    def validate_webhook_url(cls, v: str) -> str:
        return validate_url(v)

    @field_validator("secret")
    @classmethod
    def validate_secret(cls, v: str) -> str:
        """Validate secret strength."""
        # Check for sufficient entropy
        if len(set(v)) < 16:  # At least 16 unique characters
            raise ValueError(
                "Secret must have sufficient entropy (at least 16 unique characters)"
            )
        return v

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: List[str]) -> List[str]:
        """Validate events against whitelist."""
        allowed_events = {
            "transmission.created",
            "transmission.updated",
            "transcription.completed",
            "incident.created",
            "incident.updated",
            "incident.resolved",
            "incident.closed",
            "task.created",
            "task.assigned",
            "task.updated",
            "task.completed",
            "asset.created",
            "asset.updated",
            "asset.position",
            "policy.triggered",
            "geofence.breach",
        }

        for event in v:
            if event not in allowed_events:
                raise ValueError(
                    f"Invalid event: {event}. Allowed: {', '.join(sorted(allowed_events))}"
                )

        # Limit number of events
        if len(v) > 20:
            raise ValueError("Maximum 20 event subscriptions allowed")

        return v


class WebhookUpdate(BaseSchema):
    """Webhook update request."""

    url: Optional[str] = Field(None, max_length=500)
    secret: Optional[str] = Field(None, min_length=32, max_length=255)
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None
    retry_count: Optional[int] = Field(None, ge=0, le=10)
    timeout_ms: Optional[int] = Field(None, ge=1000, le=60000)

    @field_validator("url")
    @classmethod
    def validate_webhook_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_url(v) if v is not None else v

    @field_validator("secret")
    @classmethod
    def validate_secret(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(set(v)) < 16:
            raise ValueError(
                "Secret must have sufficient entropy (at least 16 unique characters)"
            )
        return v

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v

        allowed_events = {
            "transmission.created",
            "transmission.updated",
            "transcription.completed",
            "incident.created",
            "incident.updated",
            "incident.resolved",
            "incident.closed",
            "task.created",
            "task.assigned",
            "task.updated",
            "task.completed",
            "asset.created",
            "asset.updated",
            "asset.position",
            "policy.triggered",
            "geofence.breach",
        }

        for event in v:
            if event not in allowed_events:
                raise ValueError(
                    f"Invalid event: {event}. Allowed: {', '.join(sorted(allowed_events))}"
                )

        if len(v) > 20:
            raise ValueError("Maximum 20 event subscriptions allowed")

        return v


class WebhookResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Webhook response."""

    organization_id: UUID
    url: str
    events: List[str]
    is_active: bool
    retry_count: int
    timeout_ms: int
    last_triggered_at: Optional[datetime]
    last_error: Optional[str]

    model_config = {
        "from_attributes": True,
    }
