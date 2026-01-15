"""
Fleet and asset management schemas.

Security:
- VIN/serial validation
- Geographic coordinate validation
- Status whitelist
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field, field_validator

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string


class AssetCreate(BaseSchema):
    """Asset creation request."""

    asset_type: str = Field(
        ..., description="Asset type: VEHICLE, RADIO, DEVICE, EQUIPMENT"
    )
    name: str = Field(..., min_length=1, max_length=255, description="Asset name")
    vin_or_serial: Optional[str] = Field(
        None, max_length=100, description="VIN or serial number"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Custom asset properties"
    )

    @field_validator("asset_type")
    @classmethod
    def validate_asset_type(cls, v: str) -> str:
        allowed_types = {"VEHICLE", "RADIO", "DEVICE", "EQUIPMENT"}
        v_upper = v.upper()
        if v_upper not in allowed_types:
            raise ValueError(
                f"Invalid asset type: {v}. Allowed: {', '.join(sorted(allowed_types))}"
            )
        return v_upper

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("vin_or_serial")
    @classmethod
    def sanitize_vin_or_serial(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        sanitized = sanitize_string(v)
        # VIN/serial should be alphanumeric
        if not sanitized.replace("-", "").isalnum():
            raise ValueError("VIN/serial must be alphanumeric (hyphens allowed)")
        return sanitized

    @field_validator("metadata")
    @classmethod
    def validate_metadata(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if len(str(v)) > 10000:
            raise ValueError("Metadata exceeds maximum size of 10KB")
        return v


class AssetUpdate(BaseSchema):
    """Asset update request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = None
    last_known_geo: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed_statuses = {"available", "in_use", "maintenance", "offline"}
        v_lower = v.lower()
        if v_lower not in allowed_statuses:
            raise ValueError(
                f"Invalid status: {v}. Allowed: {', '.join(sorted(allowed_statuses))}"
            )
        return v_lower

    @field_validator("last_known_geo")
    @classmethod
    def validate_location_geo(
        cls, v: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if v is None:
            return v
        if "lat" in v:
            lat = float(v["lat"])
            if not (-90 <= lat <= 90):
                raise ValueError("Latitude must be between -90 and 90")
        if "lng" in v:
            lng = float(v["lng"])
            if not (-180 <= lng <= 180):
                raise ValueError("Longitude must be between -180 and 180")
        return v


class AssetResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Asset response."""

    organization_id: UUID
    asset_type: str
    name: str
    vin_or_serial: Optional[str]
    status: str
    last_known_geo: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]

    model_config = {
        "from_attributes": True,
    }


class CrewCreate(BaseSchema):
    """Crew creation request."""

    name: str = Field(..., min_length=1, max_length=255, description="Crew name")
    members: List[UUID] = Field(default_factory=list, description="Member user IDs")
    assigned_asset_id: Optional[UUID] = Field(None, description="Assigned asset ID")
    shift_start: Optional[datetime] = Field(None, description="Shift start time")
    shift_end: Optional[datetime] = Field(None, description="Shift end time")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("members")
    @classmethod
    def validate_members(cls, v: List[UUID]) -> List[UUID]:
        if len(v) > 50:
            raise ValueError("Maximum 50 crew members allowed")
        return v


class CrewUpdate(BaseSchema):
    """Crew update request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    members: Optional[List[UUID]] = None
    assigned_asset_id: Optional[UUID] = None
    status: Optional[str] = None
    shift_start: Optional[datetime] = None
    shift_end: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed_statuses = {"off_duty", "available", "dispatched", "on_scene"}
        v_lower = v.lower()
        if v_lower not in allowed_statuses:
            raise ValueError(
                f"Invalid status: {v}. Allowed: {', '.join(sorted(allowed_statuses))}"
            )
        return v_lower


class CrewResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Crew response."""

    organization_id: UUID
    name: str
    members: List[Dict[str, Any]]
    assigned_asset_id: Optional[UUID]
    status: str
    shift_start: Optional[datetime]
    shift_end: Optional[datetime]

    model_config = {
        "from_attributes": True,
    }
