"""
Security tests for Pydantic validation schemas.

Tests:
- SQL injection prevention
- XSS prevention
- Input sanitization
- Whitelist validation
- Type coercion prevention
"""

import pytest
from pydantic import ValidationError

from app.schemas import (
    # Auth
    LoginRequest,
    UserCreate,
    UserUpdate,
    # Radio
    RadioChannelCreate,
    RadioChannelUpdate,
    TransmissionCreate,
    TransmissionUpdate,
    # Incidents
    IncidentCreate,
    IncidentUpdate,
    # Tasks
    TaskCreate,
    TaskUpdate,
    ChecklistItemCreate,
    # Fleet
    AssetCreate,
    AssetUpdate,
    CrewCreate,
    # Policy
    PolicyCreate,
    PolicyUpdate,
    PolicyEvaluationRequest,
    # Webhooks
    WebhookCreate,
    WebhookUpdate,
    # Admin
    OrganizationCreate,
    OrganizationUpdate,
    FeatureFlagUpdate,
    # Base
    PaginationParams,
)
from uuid import uuid4


class TestSQLInjectionPrevention:
    """Test SQL injection attack prevention."""

    def test_prevents_union_select_in_sort(self):
        """Prevent UNION SELECT in sort parameter."""
        with pytest.raises(ValidationError) as exc:
            PaginationParams(sort="id UNION SELECT * FROM users--")

        assert "Invalid sort field" in str(exc.value)

    def test_prevents_sql_in_string_fields(self):
        """Prevent SQL keywords in string fields."""
        # Test in incident title
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire'; DROP TABLE incidents;--",
                priority="HIGH",
            )

        # Should be caught by validation
        assert exc.value is not None

    def test_whitelist_validation_for_status(self):
        """Ensure status fields use whitelist validation."""
        # Invalid status should be rejected
        with pytest.raises(ValidationError) as exc:
            IncidentUpdate(status="'; DELETE FROM incidents; --")

        assert "Invalid status" in str(exc.value)

    def test_whitelist_validation_for_priority(self):
        """Ensure priority fields use whitelist validation."""
        with pytest.raises(ValidationError) as exc:
            TransmissionCreate(
                channel_id=uuid4(),
                started_at="2025-01-01T00:00:00Z",
                priority="CRITICAL'; DROP TABLE transmissions; --",
            )

        assert "Invalid priority" in str(exc.value)

    def test_whitelist_validation_for_roles(self):
        """Ensure roles use whitelist validation."""
        with pytest.raises(ValidationError) as exc:
            UserCreate(
                email="test@example.com",
                full_name="Test User",
                roles=["admin'; DROP TABLE users; --"],
                organization_id=uuid4(),
            )

        assert "Invalid role" in str(exc.value)


class TestXSSPrevention:
    """Test XSS attack prevention."""

    def test_sanitizes_control_characters(self):
        """Reject strings with control characters."""
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire\x00\x01\x02<script>alert('xss')</script>",
                priority="HIGH",
            )

        assert "control characters" in str(exc.value)

    def test_strips_whitespace(self):
        """Ensure leading/trailing whitespace is stripped."""
        incident = IncidentCreate(
            title="  Structure Fire  ",
            priority="HIGH",
        )

        assert incident.title == "Structure Fire"

    def test_removes_null_bytes(self):
        """Ensure null bytes are removed."""
        # Null bytes should be removed by sanitization
        channel = RadioChannelCreate(
            name="Channel\x00Name",
            talkgroup="TG-001",
            source_type="SIP",
        )

        assert "\x00" not in channel.name


class TestInputValidation:
    """Test general input validation."""

    def test_rejects_extra_fields(self):
        """Ensure extra fields are rejected (forbid extra)."""
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire",
                priority="HIGH",
                malicious_field="<script>alert('xss')</script>",
            )

        assert "Extra inputs are not permitted" in str(exc.value)

    def test_validates_email_format(self):
        """Ensure email validation works."""
        with pytest.raises(ValidationError) as exc:
            UserCreate(
                email="not-an-email",
                full_name="Test User",
                organization_id=uuid4(),
            )

        assert "Invalid email format" in str(exc.value)

    def test_validates_url_protocol(self):
        """Ensure URL validation checks protocol."""
        with pytest.raises(ValidationError) as exc:
            WebhookCreate(
                url="javascript:alert('xss')",
                secret="a" * 32,
                events=["incident.created"],
            )

        assert "URL must start with http" in str(exc.value)

    def test_prevents_credentials_in_url(self):
        """Prevent URLs with embedded credentials."""
        with pytest.raises(ValidationError) as exc:
            WebhookCreate(
                url="https://user:pass@example.com/webhook",
                secret="a" * 32,
                events=["incident.created"],
            )

        assert "credentials" in str(exc.value)

    def test_validates_geographic_coordinates(self):
        """Ensure latitude/longitude are validated."""
        # Invalid latitude
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire",
                priority="HIGH",
                location_geo={"lat": 91.0, "lng": 0.0},
            )

        assert "Latitude must be between -90 and 90" in str(exc.value)

        # Invalid longitude
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire",
                priority="HIGH",
                location_geo={"lat": 0.0, "lng": 181.0},
            )

        assert "Longitude must be between -180 and 180" in str(exc.value)


class TestStrictTypeValidation:
    """Test strict type validation prevents type coercion attacks."""

    def test_rejects_string_for_integer(self):
        """Ensure integers cannot be passed as strings."""
        with pytest.raises(ValidationError) as exc:
            PaginationParams(page="1")  # String instead of int

        # Pydantic v2 with strict=True rejects type coercion
        assert exc.value is not None

    def test_rejects_string_for_boolean(self):
        """Ensure booleans cannot be passed as strings."""
        with pytest.raises(ValidationError) as exc:
            RadioChannelCreate(
                name="Channel",
                talkgroup="TG-001",
                source_type="SIP",
                is_active="true",  # String instead of bool
            )

        assert exc.value is not None

    def test_rejects_string_for_datetime(self):
        """Ensure datetimes are properly validated."""
        # This should work - valid ISO format
        task = TaskCreate(
            incident_id=uuid4(),
            title="Task",
            sla_due_at="2025-01-01T00:00:00Z",
        )
        assert task.sla_due_at is not None

        # This should fail - invalid format
        with pytest.raises(ValidationError):
            TaskCreate(
                incident_id=uuid4(),
                title="Task",
                sla_due_at="not-a-date",
            )


class TestLengthLimits:
    """Test length limits prevent DoS attacks."""

    def test_enforces_max_string_length(self):
        """Ensure maximum string lengths are enforced."""
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="A" * 501,  # Max is 500
                priority="HIGH",
            )

        assert "String should have at most 500 characters" in str(exc.value)

    def test_enforces_max_description_length(self):
        """Ensure description length is limited."""
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire",
                description="A" * 50001,  # Max is 50000
                priority="HIGH",
            )

        assert "String should have at most 50000 characters" in str(exc.value)

    def test_enforces_max_list_size(self):
        """Ensure list sizes are limited."""
        with pytest.raises(ValidationError) as exc:
            IncidentCreate(
                title="Fire",
                priority="HIGH",
                related_transmission_ids=[uuid4() for _ in range(101)],  # Max is 100
            )

        assert "Maximum 100 related transmissions allowed" in str(exc.value)

    def test_enforces_metadata_size_limit(self):
        """Ensure metadata/JSON sizes are limited."""
        with pytest.raises(ValidationError) as exc:
            RadioChannelCreate(
                name="Channel",
                talkgroup="TG-001",
                source_type="SIP",
                metadata={"data": "A" * 10001},  # Max is 10KB
            )

        assert "Metadata exceeds maximum size" in str(exc.value)


class TestYAMLValidation:
    """Test YAML content validation for policies."""

    def test_validates_yaml_syntax(self):
        """Ensure YAML syntax is validated."""
        with pytest.raises(ValidationError) as exc:
            PolicyCreate(
                name="Test Policy",
                yaml_content="invalid: yaml: content: [unclosed",
            )

        assert "Invalid YAML syntax" in str(exc.value)

    def test_prevents_yaml_depth_bomb(self):
        """Prevent deeply nested YAML (DoS attack)."""
        # Create deeply nested YAML
        deep_yaml = "a:\n" + ("  b:\n" * 11)  # 11 levels deep (max is 10)

        with pytest.raises(ValidationError) as exc:
            PolicyCreate(
                name="Test Policy",
                yaml_content=deep_yaml,
            )

        assert "nesting depth" in str(exc.value)

    def test_allows_valid_yaml(self):
        """Ensure valid YAML is accepted."""
        policy = PolicyCreate(
            name="Test Policy",
            yaml_content="""
name: test_policy
rules:
  - condition: priority == "CRITICAL"
    action: create_incident
""",
        )

        assert policy.yaml_content is not None


class TestWhitelistValidation:
    """Test whitelist validation for enum-like fields."""

    def test_validates_organization_slug_format(self):
        """Ensure organization slug is URL-safe."""
        # Valid slug
        org = OrganizationCreate(
            name="Test Org",
            slug="test-org-123",
        )
        assert org.slug == "test-org-123"

        # Invalid slug - uppercase
        with pytest.raises(ValidationError) as exc:
            OrganizationCreate(
                name="Test Org",
                slug="Test-Org",
            )
        assert "lowercase" in str(exc.value)

        # Invalid slug - spaces
        with pytest.raises(ValidationError) as exc:
            OrganizationCreate(
                name="Test Org",
                slug="test org",
            )
        assert "lowercase" in str(exc.value)

        # Invalid slug - starts with hyphen
        with pytest.raises(ValidationError) as exc:
            OrganizationCreate(
                name="Test Org",
                slug="-test-org",
            )
        assert "cannot start or end with a hyphen" in str(exc.value)

    def test_validates_operating_mode(self):
        """Ensure operating mode uses whitelist."""
        # Valid mode
        org = OrganizationCreate(
            name="Test Org",
            slug="test-org",
            default_op_mode="hitl",
        )
        assert org.default_op_mode == "hitl"

        # Invalid mode
        with pytest.raises(ValidationError) as exc:
            OrganizationCreate(
                name="Test Org",
                slug="test-org",
                default_op_mode="dangerous_mode",
            )
        assert "Invalid operating mode" in str(exc.value)

    def test_validates_feature_flags(self):
        """Ensure feature flags use whitelist."""
        # Valid feature flag
        org = OrganizationCreate(
            name="Test Org",
            slug="test-org",
            feature_flags={"autonomous_assist": True},
        )
        assert org.feature_flags["autonomous_assist"] is True

        # Invalid feature flag name
        with pytest.raises(ValidationError) as exc:
            OrganizationCreate(
                name="Test Org",
                slug="test-org",
                feature_flags={"dangerous_feature": True},
            )
        assert "Invalid feature flag" in str(exc.value)

        # Invalid feature flag value (not boolean)
        with pytest.raises(ValidationError) as exc:
            OrganizationCreate(
                name="Test Org",
                slug="test-org",
                feature_flags={"autonomous_assist": "true"},
            )
        assert "must be a boolean" in str(exc.value)


class TestWebhookSecurity:
    """Test webhook-specific security validations."""

    def test_validates_webhook_secret_strength(self):
        """Ensure webhook secrets have sufficient entropy."""
        # Weak secret (repeated characters)
        with pytest.raises(ValidationError) as exc:
            WebhookCreate(
                url="https://example.com/webhook",
                secret="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                events=["incident.created"],
            )
        assert "entropy" in str(exc.value)

        # Strong secret
        webhook = WebhookCreate(
            url="https://example.com/webhook",
            secret="abc123def456ghi789jkl012mno345pqr",
            events=["incident.created"],
        )
        assert webhook.secret is not None

    def test_validates_webhook_events_whitelist(self):
        """Ensure webhook events use whitelist."""
        # Invalid event
        with pytest.raises(ValidationError) as exc:
            WebhookCreate(
                url="https://example.com/webhook",
                secret="a" * 32,
                events=["malicious.event"],
            )
        assert "Invalid event" in str(exc.value)

    def test_limits_webhook_event_count(self):
        """Ensure webhook event count is limited."""
        # Too many events
        with pytest.raises(ValidationError) as exc:
            WebhookCreate(
                url="https://example.com/webhook",
                secret="a" * 32,
                events=["incident.created"] * 21,  # Max is 20
            )
        assert "Maximum 20 event subscriptions" in str(exc.value)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
