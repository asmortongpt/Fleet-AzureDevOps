"""
Policy management schemas.

Security:
- YAML validation
- Priority range validation
"""

from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field, field_validator
import yaml

from .base import BaseSchema, TimestampMixin, UUIDMixin, sanitize_string


class PolicyCreate(BaseSchema):
    """Policy creation request."""

    name: str = Field(..., min_length=1, max_length=255, description="Policy name")
    description: Optional[str] = Field(None, max_length=50000)
    yaml_content: str = Field(
        ..., min_length=1, max_length=100000, description="YAML rule definition"
    )
    priority: int = Field(
        default=100, ge=1, le=1000, description="Evaluation priority (lower = higher)"
    )
    is_active: bool = Field(default=False, description="Policy enabled")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v)

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("yaml_content")
    @classmethod
    def validate_yaml_content(cls, v: str) -> str:
        """Validate YAML syntax."""
        try:
            # Attempt to parse YAML
            parsed = yaml.safe_load(v)

            # Ensure it's a dict or list
            if not isinstance(parsed, (dict, list)):
                raise ValueError("YAML content must be a dictionary or list")

            # Limit depth to prevent DoS
            def check_depth(obj, depth=0):
                if depth > 10:
                    raise ValueError("YAML nesting depth exceeds maximum of 10")
                if isinstance(obj, dict):
                    for value in obj.values():
                        check_depth(value, depth + 1)
                elif isinstance(obj, list):
                    for item in obj:
                        check_depth(item, depth + 1)

            check_depth(parsed)

        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML syntax: {str(e)}")

        return v


class PolicyUpdate(BaseSchema):
    """Policy update request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=50000)
    yaml_content: Optional[str] = Field(None, min_length=1, max_length=100000)
    priority: Optional[int] = Field(None, ge=1, le=1000)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_string(v) if v is not None else v

    @field_validator("yaml_content")
    @classmethod
    def validate_yaml_content(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            parsed = yaml.safe_load(v)
            if not isinstance(parsed, (dict, list)):
                raise ValueError("YAML content must be a dictionary or list")

            def check_depth(obj, depth=0):
                if depth > 10:
                    raise ValueError("YAML nesting depth exceeds maximum of 10")
                if isinstance(obj, dict):
                    for value in obj.values():
                        check_depth(value, depth + 1)
                elif isinstance(obj, list):
                    for item in obj:
                        check_depth(item, depth + 1)

            check_depth(parsed)

        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML syntax: {str(e)}")
        return v


class PolicyResponse(BaseSchema, UUIDMixin, TimestampMixin):
    """Policy response."""

    organization_id: UUID
    name: str
    description: Optional[str]
    yaml_content: str
    is_active: bool
    priority: int

    model_config = {
        "from_attributes": True,
    }


class PolicyEvaluationRequest(BaseSchema):
    """Policy evaluation test request."""

    policy_id: UUID = Field(..., description="Policy to evaluate")
    test_data: Dict[str, Any] = Field(
        ..., description="Test data to evaluate against policy"
    )

    @field_validator("test_data")
    @classmethod
    def validate_test_data(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if len(str(v)) > 50000:
            raise ValueError("Test data exceeds maximum size of 50KB")
        return v
