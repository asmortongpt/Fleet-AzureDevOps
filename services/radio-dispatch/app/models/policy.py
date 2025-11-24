"""Dispatch policy and execution models."""

from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, ARRAY, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin, UUIDMixin


class DispatchPolicy(Base, UUIDMixin, TimestampMixin):
    """Automation policy configuration."""

    __tablename__ = "dispatch_policies"

    org_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Policy definition
    conditions = Column(JSONB, nullable=False)  # Rule engine conditions
    actions = Column(JSONB, nullable=False)  # Actions to execute

    # Control
    is_active = Column(Boolean, default=True, index=True)
    priority = Column(Integer, default=100, index=True)
    operating_mode = Column(String(20), default="hitl")  # monitor_only, hitl, autonomous

    # Audit
    created_by = Column(UUID(as_uuid=True))
    last_triggered_at = Column(DateTime)

    # Relationships
    executions = relationship("PolicyExecution", back_populates="policy")


class PolicyExecution(Base, UUIDMixin):
    """Record of policy execution."""

    __tablename__ = "dispatch_policy_executions"

    policy_id = Column(UUID(as_uuid=True), ForeignKey("dispatch_policies.id"), nullable=False, index=True)
    transmission_id = Column(UUID(as_uuid=True), ForeignKey("radio_transmissions.id"), nullable=False, index=True)

    # Execution details
    conditions_matched = Column(JSONB)
    actions_executed = Column(JSONB)
    execution_status = Column(String(20), index=True)  # pending_approval, executed, rejected, failed

    # Results
    created_incident_id = Column(UUID(as_uuid=True))
    created_task_ids = Column(ARRAY(UUID(as_uuid=True)))
    error_message = Column(Text)

    # Approval (HITL mode)
    requires_approval = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime)
    approval_notes = Column(Text)

    executed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    policy = relationship("DispatchPolicy", back_populates="executions")
    transmission = relationship("RadioTransmission", back_populates="policy_executions")


# Import datetime for default value
from datetime import datetime
