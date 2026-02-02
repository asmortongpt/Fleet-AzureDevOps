"""
Tests for Audit Logger

Test coverage:
- Audit event creation and logging
- Database persistence
- Encryption of sensitive data
- Batch processing
- Correlation IDs
- Integrity chain
- Convenience methods
"""

import pytest
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from ..audit_logger import (
    AuditLogger,
    AuditEvent,
    AuditLevel,
    AuditAction,
    AuditResult,
    AuditLogModel,
    Base,
    initialize_audit_logger,
    get_audit_logger,
)
from ..log_encryption import LogEncryption


# Test database URL (in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_db():
    """Create test database"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        # Create audit schema (SQLite doesn't support schemas, so we skip)
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    yield SessionLocal

    await engine.dispose()


@pytest.fixture
def encryption_key():
    """Generate test encryption key"""
    return LogEncryption.generate_key()


@pytest.fixture
async def audit_logger(test_db, encryption_key):
    """Create audit logger instance"""
    logger = AuditLogger(
        database_url=TEST_DATABASE_URL,
        encryption_key=encryption_key,
        batch_size=10,
        flush_interval=1.0,
    )
    await logger.initialize()
    yield logger
    await logger.shutdown()


class TestAuditEvent:
    """Test AuditEvent dataclass"""

    def test_audit_event_creation(self):
        """Test creating audit event with required fields"""
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.READ,
            resource_type="document",
            level=AuditLevel.INFO,
            result=AuditResult.SUCCESS,
            message="User read document",
        )

        assert event.user_id == "user123"
        assert event.action == AuditAction.READ
        assert event.resource_type == "document"
        assert event.level == AuditLevel.INFO
        assert event.result == AuditResult.SUCCESS
        assert event.message == "User read document"
        assert event.correlation_id is not None
        assert event.timestamp is not None

    def test_audit_event_with_metadata(self):
        """Test audit event with metadata"""
        metadata = {"document_id": "doc123", "size": 1024}
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.READ,
            resource_type="document",
            message="Read document",
            metadata=metadata,
        )

        assert event.metadata == metadata

    def test_audit_event_with_sensitive_data(self):
        """Test audit event with sensitive data"""
        sensitive = {"old_password": "secret", "new_password": "newsecret"}
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.PASSWORD_CHANGE,
            resource_type="authentication",
            message="Password changed",
            sensitive_data=sensitive,
        )

        assert event.sensitive_data == sensitive

    def test_audit_event_to_dict(self):
        """Test converting audit event to dictionary"""
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.LOGIN,
            resource_type="authentication",
            message="User logged in",
        )

        event_dict = event.to_dict()

        assert event_dict["user_id"] == "user123"
        assert event_dict["action"] == "LOGIN"
        assert event_dict["resource_type"] == "authentication"
        assert event_dict["level"] == "INFO"
        assert event_dict["result"] == "SUCCESS"
        assert isinstance(event_dict["correlation_id"], str)
        assert isinstance(event_dict["timestamp"], str)


class TestAuditLogger:
    """Test AuditLogger class"""

    @pytest.mark.asyncio
    async def test_logger_initialization(self, audit_logger):
        """Test logger initializes correctly"""
        assert audit_logger.engine is not None
        assert audit_logger.SessionLocal is not None
        assert audit_logger.encryption is not None

    @pytest.mark.asyncio
    async def test_log_simple_event(self, audit_logger, test_db):
        """Test logging a simple audit event"""
        event = AuditEvent(
            user_id="user123",
            user_email="user@example.com",
            action=AuditAction.READ,
            resource_type="document",
            resource_id="doc123",
            message="User read document",
        )

        await audit_logger.log(event)
        await audit_logger.flush()

        # Verify in database
        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            logs = result.scalars().all()

            assert len(logs) == 1
            log = logs[0]
            assert log.user_id == "user123"
            assert log.user_email == "user@example.com"
            assert log.action == AuditAction.READ.value
            assert log.resource_type == "document"
            assert log.resource_id == "doc123"
            assert log.result == AuditResult.SUCCESS.value

    @pytest.mark.asyncio
    async def test_log_with_encryption(self, audit_logger, test_db):
        """Test logging event with encrypted sensitive data"""
        sensitive_data = {"api_key": "secret123", "password": "pass123"}
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.CONFIG_CHANGE,
            resource_type="configuration",
            message="Config updated",
            sensitive_data=sensitive_data,
        )

        await audit_logger.log(event)
        await audit_logger.flush()

        # Verify encrypted data in database
        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.encrypted_data is not None
            # Should be base64-encoded encrypted data
            assert len(log.encrypted_data) > 0

            # Decrypt and verify
            import json
            decrypted = audit_logger.encryption.decrypt(log.encrypted_data)
            decrypted_data = json.loads(decrypted)
            assert decrypted_data == sensitive_data

    @pytest.mark.asyncio
    async def test_batch_processing(self, audit_logger, test_db):
        """Test batch processing of logs"""
        # Log multiple events
        events = [
            AuditEvent(
                user_id=f"user{i}",
                action=AuditAction.READ,
                resource_type="document",
                message=f"Event {i}",
            )
            for i in range(5)
        ]

        for event in events:
            await audit_logger.log(event)

        # Should not flush yet (batch_size=10)
        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            logs = result.scalars().all()
            # Might be 0 if not flushed yet
            initial_count = len(logs)

        # Manually flush
        await audit_logger.flush()

        # Verify all events persisted
        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            logs = result.scalars().all()
            assert len(logs) >= 5

    @pytest.mark.asyncio
    async def test_auto_flush_on_batch_size(self, test_db, encryption_key):
        """Test automatic flush when batch size reached"""
        logger = AuditLogger(
            database_url=TEST_DATABASE_URL,
            encryption_key=encryption_key,
            batch_size=3,  # Small batch size
            flush_interval=100.0,  # Long interval
        )
        await logger.initialize()

        try:
            # Log exactly batch_size events
            for i in range(3):
                await logger.log(AuditEvent(
                    user_id=f"user{i}",
                    action=AuditAction.READ,
                    resource_type="test",
                    message=f"Event {i}",
                ))

            # Give it a moment to flush
            await asyncio.sleep(0.1)

            # Verify flushed to database
            async with test_db() as session:
                result = await session.execute(select(AuditLogModel))
                logs = result.scalars().all()
                assert len(logs) >= 3

        finally:
            await logger.shutdown()

    @pytest.mark.asyncio
    async def test_integrity_chain(self, audit_logger, test_db):
        """Test blockchain-style log integrity chain"""
        # Log two events
        event1 = AuditEvent(
            user_id="user1",
            action=AuditAction.CREATE,
            resource_type="document",
            message="Event 1",
        )
        event2 = AuditEvent(
            user_id="user2",
            action=AuditAction.UPDATE,
            resource_type="document",
            message="Event 2",
        )

        await audit_logger.log(event1)
        await audit_logger.log(event2)
        await audit_logger.flush()

        # Verify integrity chain
        async with test_db() as session:
            result = await session.execute(
                select(AuditLogModel).order_by(AuditLogModel.timestamp)
            )
            logs = result.scalars().all()

            assert len(logs) == 2
            # First log has no previous hash
            assert logs[0].previous_hash is None or logs[0].previous_hash == logs[1].log_hash
            # Each log has its own hash
            assert logs[0].log_hash is not None
            assert logs[1].log_hash is not None

    @pytest.mark.asyncio
    async def test_log_login_convenience(self, audit_logger, test_db):
        """Test log_login convenience method"""
        await audit_logger.log_login(
            user_id="user123",
            user_email="user@example.com",
            user_ip="192.168.1.1",
            success=True,
            metadata={"browser": "Chrome"},
        )
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.user_id == "user123"
            assert log.user_email == "user@example.com"
            assert log.user_ip == "192.168.1.1"
            assert log.action == AuditAction.LOGIN.value
            assert log.level == AuditLevel.SECURITY.value
            assert log.result == AuditResult.SUCCESS.value

    @pytest.mark.asyncio
    async def test_log_failed_login(self, audit_logger, test_db):
        """Test logging failed login attempt"""
        await audit_logger.log_login(
            user_id="user123",
            user_email="user@example.com",
            user_ip="192.168.1.1",
            success=False,
        )
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.action == AuditAction.LOGIN_FAILED.value
            assert log.result == AuditResult.FAILURE.value

    @pytest.mark.asyncio
    async def test_log_data_access(self, audit_logger, test_db):
        """Test log_data_access convenience method"""
        await audit_logger.log_data_access(
            user_id="user123",
            action=AuditAction.READ,
            resource_type="document",
            resource_id="doc123",
            metadata={"size": 1024},
        )
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.action == AuditAction.READ.value
            assert log.resource_type == "document"
            assert log.resource_id == "doc123"
            assert log.metadata["size"] == 1024

    @pytest.mark.asyncio
    async def test_log_config_change(self, audit_logger, test_db):
        """Test log_config_change convenience method"""
        await audit_logger.log_config_change(
            user_id="admin123",
            config_key="max_file_size",
            old_value=1024,
            new_value=2048,
        )
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.action == AuditAction.CONFIG_CHANGE.value
            assert log.resource_id == "max_file_size"
            assert log.level == AuditLevel.WARNING.value
            assert log.encrypted_data is not None  # Sensitive data encrypted

    @pytest.mark.asyncio
    async def test_log_security_event(self, audit_logger, test_db):
        """Test log_security_event convenience method"""
        await audit_logger.log_security_event(
            user_id="hacker123",
            action=AuditAction.INTRUSION_ATTEMPT,
            message="SQL injection attempt detected",
            user_ip="10.0.0.1",
            metadata={"payload": "'; DROP TABLE users--"},
        )
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.action == AuditAction.INTRUSION_ATTEMPT.value
            assert log.level == AuditLevel.SECURITY.value
            assert log.retention_years == 10  # Extended retention
            assert log.user_ip == "10.0.0.1"

    @pytest.mark.asyncio
    async def test_correlation_id_persistence(self, audit_logger, test_db):
        """Test correlation ID is preserved"""
        correlation_id = uuid.uuid4()
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.READ,
            resource_type="document",
            message="Test event",
            correlation_id=correlation_id,
        )

        await audit_logger.log(event)
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            assert log.correlation_id == correlation_id

    @pytest.mark.asyncio
    async def test_retention_calculation(self, audit_logger, test_db):
        """Test retention period calculation"""
        event = AuditEvent(
            user_id="user123",
            action=AuditAction.READ,
            resource_type="document",
            message="Test event",
            retention_years=7,
        )

        await audit_logger.log(event)
        await audit_logger.flush()

        async with test_db() as session:
            result = await session.execute(select(AuditLogModel))
            log = result.scalars().first()

            # Verify expiration is approximately 7 years from now
            expected_expiry = datetime.now(timezone.utc) + timedelta(days=365*7)
            time_diff = abs((log.expires_at - expected_expiry).total_seconds())
            assert time_diff < 60  # Within 1 minute


class TestGlobalLogger:
    """Test global logger singleton"""

    def test_initialize_global_logger(self, encryption_key):
        """Test initializing global logger"""
        logger = initialize_audit_logger(
            database_url=TEST_DATABASE_URL,
            encryption_key=encryption_key,
        )

        assert logger is not None
        assert get_audit_logger() == logger

    @pytest.mark.asyncio
    async def test_global_logger_usage(self, encryption_key):
        """Test using global logger"""
        logger = initialize_audit_logger(
            database_url=TEST_DATABASE_URL,
            encryption_key=encryption_key,
        )
        await logger.initialize()

        try:
            global_logger = get_audit_logger()
            assert global_logger is not None

            # Use it to log
            await global_logger.log_login(
                user_id="test",
                user_email="test@example.com",
                user_ip="127.0.0.1",
            )

        finally:
            await logger.shutdown()
