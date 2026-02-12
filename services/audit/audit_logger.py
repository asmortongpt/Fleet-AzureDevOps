"""
Audit Logger - Core audit logging service for CTAFleet

This module provides structured audit logging with correlation IDs,
security event tracking, and compliance-ready audit trails.

Security Requirements:
- Log all security-sensitive operations (auth, data access, config changes)
- Include user, timestamp, action, resource, result in every log
- Correlation IDs for request tracing
- Structured logging for analysis
- Performance optimization for high-volume logging
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, asdict, field

import structlog
from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, DateTime, Text, Integer, Index, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import UUID, JSONB

from .log_encryption import LogEncryption


# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)


class AuditLevel(str, Enum):
    """Audit log severity levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    SECURITY = "SECURITY"  # Special level for security events


class AuditAction(str, Enum):
    """Standard audit actions for consistency"""
    # Authentication & Authorization
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    PASSWORD_RESET = "PASSWORD_RESET"
    MFA_ENABLED = "MFA_ENABLED"
    MFA_DISABLED = "MFA_DISABLED"
    TOKEN_ISSUED = "TOKEN_ISSUED"
    TOKEN_REVOKED = "TOKEN_REVOKED"
    PERMISSION_DENIED = "PERMISSION_DENIED"

    # Data Operations
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    EXPORT = "EXPORT"
    IMPORT = "IMPORT"

    # Configuration Changes
    CONFIG_CHANGE = "CONFIG_CHANGE"
    POLICY_CREATE = "POLICY_CREATE"
    POLICY_UPDATE = "POLICY_UPDATE"
    POLICY_DELETE = "POLICY_DELETE"
    FEATURE_FLAG_TOGGLE = "FEATURE_FLAG_TOGGLE"

    # System Events
    SYSTEM_START = "SYSTEM_START"
    SYSTEM_STOP = "SYSTEM_STOP"
    BACKUP_CREATED = "BACKUP_CREATED"
    BACKUP_RESTORED = "BACKUP_RESTORED"

    # Security Events
    INTRUSION_ATTEMPT = "INTRUSION_ATTEMPT"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    ENCRYPTION_KEY_ROTATION = "ENCRYPTION_KEY_ROTATION"


class AuditResult(str, Enum):
    """Result of the audited operation"""
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    PARTIAL = "PARTIAL"
    DENIED = "DENIED"


Base = declarative_base()


class AuditLogModel(Base):
    """Database model for audit logs with PostgreSQL-specific features"""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_timestamp', 'timestamp'),
        Index('idx_audit_correlation', 'correlation_id'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_level', 'level'),
        {'schema': 'audit'}
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Who
    user_id = Column(String(255), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    user_ip = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)

    # What
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(255), nullable=True, index=True)
    resource_name = Column(String(255), nullable=True)

    # How & Result
    level = Column(String(20), nullable=False, index=True)
    result = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)

    # Context (encrypted if sensitive)
    metadata = Column(JSONB, nullable=True)
    encrypted_data = Column(Text, nullable=True)  # Encrypted sensitive data

    # Audit trail integrity
    previous_hash = Column(String(64), nullable=True)  # For blockchain-style integrity
    log_hash = Column(String(64), nullable=False)  # SHA-256 of log content

    # Retention
    retention_years = Column(Integer, default=7)
    expires_at = Column(DateTime(timezone=True), nullable=False)


@dataclass
class AuditEvent:
    """
    Structured audit event for logging

    Required fields: user_id, action, resource_type, level, result, message
    Optional fields: resource_id, metadata, sensitive_data, correlation_id
    """
    # Who performed the action
    user_id: str
    user_email: Optional[str] = None
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None

    # What action was performed
    action: AuditAction = AuditAction.READ
    resource_type: str = ""
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None

    # How and result
    level: AuditLevel = AuditLevel.INFO
    result: AuditResult = AuditResult.SUCCESS
    message: str = ""

    # Additional context
    metadata: Dict[str, Any] = field(default_factory=dict)
    sensitive_data: Optional[Dict[str, Any]] = None  # Will be encrypted

    # Request tracking
    correlation_id: Optional[uuid.UUID] = None
    timestamp: Optional[datetime] = None

    # Retention policy
    retention_years: int = 7

    def __post_init__(self):
        """Initialize computed fields"""
        if self.correlation_id is None:
            self.correlation_id = uuid.uuid4()
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging"""
        data = asdict(self)
        # Convert enums to strings
        data['action'] = self.action.value
        data['level'] = self.level.value
        data['result'] = self.result.value
        data['correlation_id'] = str(self.correlation_id)
        data['timestamp'] = self.timestamp.isoformat()
        return data


class AuditLogger:
    """
    Production-ready audit logger with encryption, persistence, and compliance features

    Features:
    - Structured logging with correlation IDs
    - AES-256 encryption for sensitive data
    - Database persistence with indexing
    - 7-year retention by default (configurable)
    - Performance optimized with batching
    - Blockchain-style integrity checking
    """

    def __init__(
        self,
        database_url: str,
        encryption_key: Optional[str] = None,
        batch_size: int = 100,
        flush_interval: float = 5.0,
        enable_integrity_chain: bool = True,
    ):
        """
        Initialize audit logger

        Args:
            database_url: PostgreSQL connection string
            encryption_key: AES-256 encryption key (32 bytes base64)
            batch_size: Number of logs to batch before writing
            flush_interval: Seconds between automatic flushes
            enable_integrity_chain: Enable blockchain-style log chaining
        """
        self.database_url = database_url
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.enable_integrity_chain = enable_integrity_chain

        # Initialize encryption
        self.encryption = LogEncryption(encryption_key) if encryption_key else None

        # Structured logger
        self.logger = structlog.get_logger(__name__)

        # Batch queue
        self._batch: List[AuditEvent] = []
        self._batch_lock = asyncio.Lock()
        self._last_flush = datetime.now(timezone.utc)

        # Last log hash for integrity chain
        self._last_hash: Optional[str] = None

        # Database setup
        self.engine = None
        self.SessionLocal = None

    async def initialize(self):
        """Initialize database connection and create schema"""
        self.engine = create_async_engine(
            self.database_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
        )

        self.SessionLocal = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        # Create audit schema and table
        async with self.engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS audit"))
            await conn.run_sync(Base.metadata.create_all)

        self.logger.info("audit_logger_initialized", database_url=self.database_url)

    async def shutdown(self):
        """Flush remaining logs and close database connection"""
        await self.flush()
        if self.engine:
            await self.engine.dispose()
        self.logger.info("audit_logger_shutdown")

    async def log(self, event: AuditEvent):
        """
        Log an audit event (async, batched for performance)

        Args:
            event: AuditEvent to log
        """
        # Log to structured logger immediately
        self.logger.log(
            event.level.value.lower(),
            event.message,
            **event.to_dict()
        )

        # Add to batch for database persistence
        async with self._batch_lock:
            self._batch.append(event)

            # Flush if batch is full or interval elapsed
            should_flush = (
                len(self._batch) >= self.batch_size or
                (datetime.now(timezone.utc) - self._last_flush).total_seconds() >= self.flush_interval
            )

        if should_flush:
            await self.flush()

    async def flush(self):
        """Flush batched logs to database"""
        async with self._batch_lock:
            if not self._batch:
                return

            batch = self._batch.copy()
            self._batch.clear()
            self._last_flush = datetime.now(timezone.utc)

        # Persist batch to database
        async with self.SessionLocal() as session:
            try:
                for event in batch:
                    log_model = await self._event_to_model(event)
                    session.add(log_model)

                await session.commit()
                self.logger.debug("audit_batch_flushed", count=len(batch))

            except Exception as e:
                await session.rollback()
                self.logger.error("audit_flush_failed", error=str(e), count=len(batch))
                raise

    async def _event_to_model(self, event: AuditEvent) -> AuditLogModel:
        """Convert AuditEvent to database model with encryption and integrity"""
        import hashlib

        # Encrypt sensitive data if present
        encrypted_data = None
        if event.sensitive_data and self.encryption:
            encrypted_data = self.encryption.encrypt(json.dumps(event.sensitive_data))

        # Calculate expiration based on retention policy
        from dateutil.relativedelta import relativedelta
        expires_at = event.timestamp + relativedelta(years=event.retention_years)

        # Prepare log content for hashing
        log_content = f"{event.correlation_id}|{event.timestamp.isoformat()}|{event.user_id}|{event.action.value}|{event.resource_type}|{event.result.value}"

        # Calculate log hash
        log_hash = hashlib.sha256(log_content.encode()).hexdigest()

        # Previous hash for blockchain-style integrity
        previous_hash = self._last_hash if self.enable_integrity_chain else None
        self._last_hash = log_hash

        return AuditLogModel(
            correlation_id=event.correlation_id,
            timestamp=event.timestamp,
            user_id=event.user_id,
            user_email=event.user_email,
            user_ip=event.user_ip,
            user_agent=event.user_agent,
            action=event.action.value,
            resource_type=event.resource_type,
            resource_id=event.resource_id,
            resource_name=event.resource_name,
            level=event.level.value,
            result=event.result.value,
            message=event.message,
            metadata=event.metadata,
            encrypted_data=encrypted_data,
            previous_hash=previous_hash,
            log_hash=log_hash,
            retention_years=event.retention_years,
            expires_at=expires_at,
        )

    # Convenience methods for common audit events

    async def log_login(
        self,
        user_id: str,
        user_email: str,
        user_ip: str,
        success: bool = True,
        metadata: Optional[Dict] = None
    ):
        """Log user login attempt"""
        await self.log(AuditEvent(
            user_id=user_id,
            user_email=user_email,
            user_ip=user_ip,
            action=AuditAction.LOGIN if success else AuditAction.LOGIN_FAILED,
            resource_type="authentication",
            level=AuditLevel.SECURITY,
            result=AuditResult.SUCCESS if success else AuditResult.FAILURE,
            message=f"User login {'successful' if success else 'failed'}",
            metadata=metadata or {},
        ))

    async def log_data_access(
        self,
        user_id: str,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Log data access operation"""
        await self.log(AuditEvent(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            level=AuditLevel.INFO,
            result=AuditResult.SUCCESS,
            message=f"{action.value} {resource_type}" + (f" {resource_id}" if resource_id else ""),
            metadata=metadata or {},
        ))

    async def log_config_change(
        self,
        user_id: str,
        config_key: str,
        old_value: Any,
        new_value: Any,
        metadata: Optional[Dict] = None
    ):
        """Log configuration change"""
        await self.log(AuditEvent(
            user_id=user_id,
            action=AuditAction.CONFIG_CHANGE,
            resource_type="configuration",
            resource_id=config_key,
            resource_name=config_key,
            level=AuditLevel.WARNING,
            result=AuditResult.SUCCESS,
            message=f"Configuration changed: {config_key}",
            sensitive_data={"old_value": old_value, "new_value": new_value},
            metadata=metadata or {},
        ))

    async def log_security_event(
        self,
        user_id: str,
        action: AuditAction,
        message: str,
        user_ip: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Log security event"""
        await self.log(AuditEvent(
            user_id=user_id,
            user_ip=user_ip,
            action=action,
            resource_type="security",
            level=AuditLevel.SECURITY,
            result=AuditResult.DENIED if action == AuditAction.PERMISSION_DENIED else AuditResult.FAILURE,
            message=message,
            metadata=metadata or {},
            retention_years=10,  # Extended retention for security events
        ))


# Singleton instance for application-wide use
_audit_logger: Optional[AuditLogger] = None


def get_audit_logger() -> Optional[AuditLogger]:
    """Get the global audit logger instance"""
    return _audit_logger


def initialize_audit_logger(
    database_url: str,
    encryption_key: Optional[str] = None,
    **kwargs
) -> AuditLogger:
    """Initialize and return global audit logger"""
    global _audit_logger
    _audit_logger = AuditLogger(database_url, encryption_key, **kwargs)
    return _audit_logger
