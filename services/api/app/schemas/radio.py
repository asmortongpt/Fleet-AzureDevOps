"""
Radio channel and transmission schemas.

Security:
- Strict type validation
- String sanitization
- URL validation for audio URIs
- Entity JSON validation
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field, field_validator

from .base import (
    BaseSchema,
    TimestampMixin,
    UUIDMixin,
    sanitize_string,
    validate_url,
)


class RadioChannelCreate(BaseSchema):
    """Radio channel creation request."""

    name: str = Field(..., min_length=1, max_length=255, description="Channel name")
    talkgroup: str = Field(
        ..., min_length=1, max_length=100, description="Talkgroup identifier"
    )
    source_type: str = Field(
        ..., description="Source type: SIP, ICECAST, FILE, API"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Source-specific metadata"
    )
    is_active: bool = Field(default=True, description="Monitoring enabled")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("talkgroup")
    @classmethod
    def sanitize_talkgroup(cls, v: str) -> str:
        # Talkgroups should be alphanumeric with hyphens/underscores
        sanitized = sanitize_string(v)
        if not sanitized.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Talkgroup must contain only alphanumeric characters, hyphens, and underscores"
            )
        return sanitized

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        """Validate source type against whitelist."""
        allowed_types = {"SIP", "ICECAST", "FILE", "API"}
        v_upper = v.upper()

        if v_upper not in allowed_types:
            raise ValueError(
                f"Invalid source type: {v}. Allowed: {', '.join(sorted(allowed_types))}"
            )

        return v_upper

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Validate metadata structure."""
        # Limit metadata size to prevent DoS
        if len(str(v)) > 10000:
            raise ValueError("Metadata exceeds maximum size of 10KB")

        return v


class RadioChannelUpdate(BaseSchema):
    """Radio channel update request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Validate metadata structure."""
        if v is None:
            return v

        # Limit metadata size
        if len(str(v)) > 10000:
            raise ValueError("Metadata exceeds maximum size of 10KB")

        return v


class RadioChannelResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Radio channel response."""

    name: str
    talkgroup: str
    source_type: str
    metadata: Dict[str, Any]
    is_active: bool
    organization_id: UUID

    model_config = {
        "from_attributes": True,
    }


class TransmissionCreate(BaseSchema):
    """Transmission creation request."""

    channel_id: UUID = Field(..., description="Radio channel ID")
    started_at: datetime = Field(..., description="Transmission start time")
    ended_at: Optional[datetime] = Field(None, description="Transmission end time")
    duration_ms: Optional[int] = Field(
        None, ge=0, le=3600000, description="Duration in milliseconds (max 1 hour)"
    )
    audio_uri: Optional[str] = Field(
        None, max_length=500, description="Azure Blob Storage URI"
    )
    priority: str = Field(
        default="NORMAL", description="Priority: LOW, NORMAL, HIGH, URGENT, CRITICAL"
    )
    tags: List[str] = Field(default_factory=list, description="Custom tags")

    @field_validator("audio_uri")
    @classmethod
    def validate_audio_uri(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        # Validate URL format
        validated = validate_url(v)

        # Additional Azure Blob Storage validation
        if not (
            "blob.core.windows.net" in validated
            or "azurestaticapps.net" in validated
            or "localhost" in validated  # Allow localhost for dev
        ):
            raise ValueError(
                "Audio URI must be from Azure Blob Storage or approved domain"
            )

        return validated

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Validate priority against whitelist."""
        allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"}
        v_upper = v.upper()

        if v_upper not in allowed_priorities:
            raise ValueError(
                f"Invalid priority: {v}. Allowed: {', '.join(sorted(allowed_priorities))}"
            )

        return v_upper

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Sanitize and validate tags."""
        if len(v) > 50:
            raise ValueError("Maximum 50 tags allowed")

        sanitized_tags = []
        for tag in v:
            sanitized = sanitize_string(tag)
            if len(sanitized) > 50:
                raise ValueError("Tag length must not exceed 50 characters")
            sanitized_tags.append(sanitized)

        return sanitized_tags


class TransmissionUpdate(BaseSchema):
    """Transmission update request."""

    ended_at: Optional[datetime] = None
    duration_ms: Optional[int] = Field(None, ge=0, le=3600000)
    transcript: Optional[str] = Field(None, max_length=50000)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    entities: Optional[Dict[str, Any]] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None

    @field_validator("transcript")
    @classmethod
    def sanitize_transcript(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("entities")
    @classmethod
    def validate_entities(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Validate entities structure."""
        if v is None:
            return v

        # Limit entities size
        if len(str(v)) > 50000:
            raise ValueError("Entities exceed maximum size of 50KB")

        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"}
        v_upper = v.upper()

        if v_upper not in allowed_priorities:
            raise ValueError(
                f"Invalid priority: {v}. Allowed: {', '.join(sorted(allowed_priorities))}"
            )

        return v_upper

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        allowed_statuses = {"pending", "processing", "completed", "failed"}
        v_lower = v.lower()

        if v_lower not in allowed_statuses:
            raise ValueError(
                f"Invalid status: {v}. Allowed: {', '.join(sorted(allowed_statuses))}"
            )

        return v_lower


class TransmissionResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Transmission response."""

    channel_id: UUID
    started_at: datetime
    ended_at: Optional[datetime]
    duration_ms: Optional[int]
    audio_uri: Optional[str]
    transcript: Optional[str]
    confidence: Optional[float]
    entities: Dict[str, Any]
    priority: str
    tags: List[str]
    status: str

    model_config = {
        "from_attributes": True,
    }
