"""Azure Speech-to-Text transcription service."""

import asyncio
from typing import Optional, Tuple
from pathlib import Path
import tempfile

import azure.cognitiveservices.speech as speechsdk
from azure.storage.blob import BlobServiceClient, ContentSettings
from pydub import AudioSegment

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TranscriptionService:
    """Service for audio transcription using Azure Cognitive Services."""

    def __init__(self):
        """Initialize transcription service."""
        self.speech_key = settings.AZURE_SPEECH_KEY
        self.speech_region = settings.AZURE_SPEECH_REGION
        self.speech_language = settings.AZURE_SPEECH_LANGUAGE

        # Azure Blob Storage for audio files
        self.blob_client = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        self.container_name = settings.AZURE_STORAGE_CONTAINER

        logger.info("TranscriptionService initialized",
                    region=self.speech_region,
                    language=self.speech_language)

    async def transcribe_audio(
        self,
        audio_file_path: str,
        language: Optional[str] = None
    ) -> Tuple[str, float]:
        """
        Transcribe audio file using Azure Speech-to-Text.

        Args:
            audio_file_path: Path to audio file
            language: Optional language code (default from settings)

        Returns:
            Tuple of (transcript_text, confidence_score)

        Raises:
            Exception: If transcription fails
        """
        lang = language or self.speech_language

        try:
            logger.info("Starting transcription",
                        file=audio_file_path,
                        language=lang)

            # Convert audio to WAV format if needed
            wav_path = await self._convert_to_wav(audio_file_path)

            # Configure speech recognizer
            speech_config = speechsdk.SpeechConfig(
                subscription=self.speech_key,
                region=self.speech_region
            )
            speech_config.speech_recognition_language = lang

            # Enable detailed results for confidence scores
            speech_config.output_format = speechsdk.OutputFormat.Detailed

            audio_config = speechsdk.AudioConfig(filename=str(wav_path))

            # Create recognizer
            recognizer = speechsdk.SpeechRecognizer(
                speech_config=speech_config,
                audio_config=audio_config
            )

            # Perform recognition
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                recognizer.recognize_once
            )

            # Process result
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                # Extract confidence from JSON details
                confidence = self._extract_confidence(result)

                logger.info("Transcription successful",
                            text_length=len(result.text),
                            confidence=confidence)

                return result.text, confidence

            elif result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning("No speech detected in audio")
                return "", 0.0

            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                logger.error("Transcription canceled",
                             reason=cancellation.reason,
                             error_details=cancellation.error_details)
                raise Exception(f"Transcription failed: {cancellation.error_details}")

            else:
                raise Exception(f"Unknown recognition result: {result.reason}")

        except Exception as e:
            logger.error("Transcription error", error=str(e))
            raise

    async def upload_audio(
        self,
        audio_data: bytes,
        filename: str,
        content_type: str = "audio/wav"
    ) -> str:
        """
        Upload audio file to Azure Blob Storage.

        Args:
            audio_data: Raw audio bytes
            filename: Name for the blob
            content_type: MIME type

        Returns:
            Public URL of uploaded audio
        """
        try:
            blob_client = self.blob_client.get_blob_client(
                container=self.container_name,
                blob=filename
            )

            # Upload with proper content type
            blob_client.upload_blob(
                audio_data,
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type)
            )

            # Return public URL
            url = blob_client.url
            logger.info("Audio uploaded", filename=filename, url=url)
            return url

        except Exception as e:
            logger.error("Audio upload failed", error=str(e), filename=filename)
            raise

    async def download_audio(self, blob_name: str) -> bytes:
        """Download audio from Azure Blob Storage."""
        try:
            blob_client = self.blob_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            return blob_client.download_blob().readall()

        except Exception as e:
            logger.error("Audio download failed", error=str(e), blob=blob_name)
            raise

    async def _convert_to_wav(self, audio_path: str) -> Path:
        """Convert audio file to WAV format if needed."""
        path = Path(audio_path)

        if path.suffix.lower() == ".wav":
            return path

        try:
            logger.info("Converting audio to WAV", original_format=path.suffix)

            # Load audio with pydub
            audio = AudioSegment.from_file(str(path))

            # Create temp WAV file
            temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            wav_path = Path(temp_file.name)

            # Export as WAV (16-bit PCM, 16kHz mono)
            audio.set_channels(1).set_frame_rate(16000).export(
                str(wav_path),
                format="wav",
                codec="pcm_s16le"
            )

            logger.info("Audio converted successfully", output=str(wav_path))
            return wav_path

        except Exception as e:
            logger.error("Audio conversion failed", error=str(e))
            raise

    def _extract_confidence(self, result: speechsdk.SpeechRecognitionResult) -> float:
        """Extract confidence score from recognition result."""
        try:
            # Azure returns confidence in JSON format
            import json
            details = json.loads(result.json)

            # Get average confidence from NBest results
            if "NBest" in details and details["NBest"]:
                confidences = [item.get("Confidence", 0.0) for item in details["NBest"]]
                return sum(confidences) / len(confidences) if confidences else 0.0

            return 0.75  # Default confidence if not available

        except Exception:
            return 0.75  # Fallback confidence
