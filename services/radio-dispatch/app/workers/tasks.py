"""Celery tasks for audio processing."""

import asyncio
import uuid
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from .celery_app import celery_app
from app.core.config import settings
from app.core.logging import get_logger
from app.services.transcription import TranscriptionService
from app.services.nlp_analyzer import NLPAnalyzer
from app.services.policy_engine import PolicyEngine
from app.services.fleet_api import FleetAPIClient
from app.models.radio import RadioTransmission

logger = get_logger(__name__)

# Create async engine for workers
async_engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    echo=settings.DEBUG
)

AsyncSessionLocal = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def _get_db_session():
    """Get database session."""
    async with AsyncSessionLocal() as session:
        return session


@celery_app.task(bind=True, max_retries=3)
def process_audio_transmission(self, transmission_id: str):
    """
    Process audio transmission: transcribe, analyze, and apply policies.

    Args:
        transmission_id: UUID of transmission to process

    Returns:
        Dict with processing results
    """
    try:
        logger.info("Processing audio transmission",
                    transmission_id=transmission_id,
                    task_id=self.request.id)

        # Run async processing in event loop
        result = asyncio.run(_process_audio_async(transmission_id))

        logger.info("Processing complete", transmission_id=transmission_id)

        return result

    except Exception as e:
        logger.error("Processing failed",
                     transmission_id=transmission_id,
                     error=str(e),
                     retry_count=self.request.retries)

        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _process_audio_async(transmission_id: str) -> dict:
    """
    Async processing pipeline for audio transmission.

    Pipeline:
    1. Get transmission from database
    2. Download audio from blob storage
    3. Transcribe with Azure Speech-to-Text
    4. Analyze with NLP
    5. Update transmission record
    6. Evaluate policies
    7. Execute actions (if autonomous) or queue for approval (if HITL)
    """
    temp_audio_file: Optional[Path] = None

    try:
        # Initialize services
        transcription_service = TranscriptionService()
        nlp_analyzer = NLPAnalyzer()
        fleet_api = FleetAPIClient()

        async with AsyncSessionLocal() as db_session:
            # 1. Get transmission from database
            result = await db_session.execute(
                select(RadioTransmission).where(
                    RadioTransmission.id == uuid.UUID(transmission_id)
                )
            )
            transmission = result.scalar_one()

            # Update status to processing
            transmission.processing_status = "transcribing"
            await db_session.commit()

            # 2. Download audio from blob storage
            logger.info("Downloading audio", audio_uri=transmission.audio_uri)

            # Extract blob name from URI
            blob_name = transmission.audio_uri.split("/")[-1]
            audio_data = await transcription_service.download_audio(blob_name)

            # Save to temp file for processing
            temp_file = tempfile.NamedTemporaryFile(
                suffix=f".{transmission.audio_format}",
                delete=False
            )
            temp_audio_file = Path(temp_file.name)
            temp_file.write(audio_data)
            temp_file.close()

            # 3. Transcribe with Azure Speech-to-Text
            logger.info("Transcribing audio", file=str(temp_audio_file))
            transcript, confidence = await transcription_service.transcribe_audio(
                str(temp_audio_file),
                language=transmission.language_code
            )

            # Update transmission with transcript
            transmission.transcript = transcript
            transmission.transcript_confidence = confidence
            transmission.processing_status = "analyzing"
            await db_session.commit()

            logger.info("Transcription complete",
                        text_length=len(transcript),
                        confidence=confidence)

            # 4. Analyze with NLP
            if transcript:
                logger.info("Analyzing transcript with NLP")
                analysis = await nlp_analyzer.analyze_transcript(transcript)

                # Update transmission with analysis results
                transmission.entities = {
                    "unit_ids": analysis.unit_ids,
                    "locations": analysis.locations,
                    "incident_codes": analysis.incident_codes,
                    "people": analysis.people,
                    "organizations": analysis.organizations,
                    "times": analysis.times
                }
                transmission.intent = analysis.intent
                transmission.priority = analysis.priority
                transmission.tags = analysis.tags

                logger.info("NLP analysis complete",
                            priority=analysis.priority,
                            intent=analysis.intent,
                            unit_count=len(analysis.unit_ids))

            # 5. Mark processing complete
            transmission.processing_status = "complete"
            await db_session.commit()

            # 6. Evaluate policies
            logger.info("Evaluating dispatch policies")
            policy_engine = PolicyEngine(db_session, fleet_api)
            executions = await policy_engine.evaluate_transmission(transmission)

            logger.info(f"Policy evaluation complete: {len(executions)} policies matched")

            # Clean up temp file
            if temp_audio_file and temp_audio_file.exists():
                temp_audio_file.unlink()

            return {
                "status": "complete",
                "transmission_id": transmission_id,
                "transcript_length": len(transcript) if transcript else 0,
                "confidence": confidence,
                "priority": transmission.priority,
                "intent": transmission.intent,
                "policies_matched": len(executions),
                "processed_at": datetime.utcnow().isoformat()
            }

    except Exception as e:
        # Update transmission with error
        try:
            async with AsyncSessionLocal() as db_session:
                result = await db_session.execute(
                    select(RadioTransmission).where(
                        RadioTransmission.id == uuid.UUID(transmission_id)
                    )
                )
                transmission = result.scalar_one()
                transmission.processing_status = "failed"
                transmission.error_message = str(e)
                await db_session.commit()
        except Exception as db_error:
            logger.error("Failed to update transmission error status",
                         error=str(db_error))

        # Clean up temp file if exists
        if temp_audio_file and temp_audio_file.exists():
            temp_audio_file.unlink()

        raise


@celery_app.task(bind=True, max_retries=3)
def transcribe_audio_only(self, transmission_id: str):
    """
    Transcribe audio only (without NLP or policy evaluation).

    Args:
        transmission_id: UUID of transmission to transcribe

    Returns:
        Dict with transcription results
    """
    try:
        logger.info("Transcribing audio only",
                    transmission_id=transmission_id,
                    task_id=self.request.id)

        result = asyncio.run(_transcribe_audio_only_async(transmission_id))

        return result

    except Exception as e:
        logger.error("Transcription failed",
                     transmission_id=transmission_id,
                     error=str(e))
        raise self.retry(exc=e, countdown=30 * (2 ** self.request.retries))


async def _transcribe_audio_only_async(transmission_id: str) -> dict:
    """Async transcription only."""
    temp_audio_file: Optional[Path] = None

    try:
        transcription_service = TranscriptionService()

        async with AsyncSessionLocal() as db_session:
            # Get transmission
            result = await db_session.execute(
                select(RadioTransmission).where(
                    RadioTransmission.id == uuid.UUID(transmission_id)
                )
            )
            transmission = result.scalar_one()

            # Download audio
            blob_name = transmission.audio_uri.split("/")[-1]
            audio_data = await transcription_service.download_audio(blob_name)

            # Save to temp file
            temp_file = tempfile.NamedTemporaryFile(
                suffix=f".{transmission.audio_format}",
                delete=False
            )
            temp_audio_file = Path(temp_file.name)
            temp_file.write(audio_data)
            temp_file.close()

            # Transcribe
            transcript, confidence = await transcription_service.transcribe_audio(
                str(temp_audio_file),
                language=transmission.language_code
            )

            # Update transmission
            transmission.transcript = transcript
            transmission.transcript_confidence = confidence
            transmission.processing_status = "complete"
            await db_session.commit()

            # Clean up
            if temp_audio_file and temp_audio_file.exists():
                temp_audio_file.unlink()

            return {
                "status": "complete",
                "transmission_id": transmission_id,
                "transcript": transcript,
                "confidence": confidence
            }

    except Exception as e:
        if temp_audio_file and temp_audio_file.exists():
            temp_audio_file.unlink()
        raise
