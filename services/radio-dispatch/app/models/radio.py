"""Radio transmission and channel models."""

from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey, ARRAY, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin, UUIDMixin


class RadioChannel(Base, UUIDMixin, TimestampMixin):
    """Radio channel/talkgroup configuration."""

    __tablename__ = "radio_channels"

    org_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    talkgroup = Column(String(50))
    source_type = Column(String(20), nullable=False)  # SIP, HTTP, FILE, API
    source_config = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    transmissions = relationship("RadioTransmission", back_populates="channel")


class RadioTransmission(Base, UUIDMixin, TimestampMixin):
    """Individual radio transmission with AI analysis."""

    __tablename__ = "radio_transmissions"

    channel_id = Column(UUID(as_uuid=True), ForeignKey("radio_channels.id"), nullable=False, index=True)
    org_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Audio metadata
    started_at = Column(DateTime, nullable=False, index=True)
    ended_at = Column(DateTime)
    duration_seconds = Column(Float)
    audio_uri = Column(Text)
    audio_format = Column(String(20), default="wav")

    # Transcription
    transcript = Column(Text)
    transcript_confidence = Column(Float)  # 0.00 to 1.00
    language_code = Column(String(10), default="en-US")

    # AI Analysis
    entities = Column(JSONB)  # {"unit_ids": ["E42"], "locations": ["5th and Main"], "codes": ["CODE 3"]}
    intent = Column(String(50))  # dispatch_request, status_update, emergency, etc.
    priority = Column(String(20), default="NORMAL", index=True)  # CRITICAL, HIGH, NORMAL, LOW
    tags = Column(ARRAY(Text))

    # Processing status
    processing_status = Column(String(20), default="pending", index=True)  # pending, transcribing, analyzing, complete, failed
    error_message = Column(Text)

    # Relationships
    related_incident_id = Column(UUID(as_uuid=True), index=True)
    related_task_id = Column(UUID(as_uuid=True))

    # SQLAlchemy relationships
    channel = relationship("RadioChannel", back_populates="transmissions")
    policy_executions = relationship("PolicyExecution", back_populates="transmission")


class AudioProcessingQueue(Base, UUIDMixin, TimestampMixin):
    """Queue for async audio processing."""

    __tablename__ = "audio_processing_queue"

    transmission_id = Column(UUID(as_uuid=True), ForeignKey("radio_transmissions.id"), nullable=False)
    status = Column(String(20), default="queued")  # queued, processing, completed, failed
    retry_count = Column(Integer, default=0)
    error_message = Column(Text)
    processed_at = Column(DateTime)
