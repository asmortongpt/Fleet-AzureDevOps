"""
Kafka consumer for real-time event streaming to WebSocket clients.
Consumes events from Kafka topics and broadcasts to appropriate Socket.IO rooms.
"""
import asyncio
import logging
import json
from typing import Dict, Any, Optional, List
from aiokafka import AIOKafkaConsumer
from aiokafka.errors import KafkaConnectionError
from aiokafka.structs import ConsumerRecord
import socketio

logger = logging.getLogger(__name__)


class KafkaEventConsumer:
    """
    Async Kafka consumer for processing events and broadcasting to WebSocket clients.
    """

    # Event type to Socket.IO event name mapping
    EVENT_MAPPINGS = {
        "transmission.started": "transmission_started",
        "transmission.completed": "transmission_completed",
        "transcription.completed": "transcription_completed",
        "transmission.tagged": "transmission_tagged",
        "incident.created": "incident_created",
        "incident.updated": "incident_updated",
        "incident.status_changed": "incident_status_changed",
        "task.assigned": "task_assigned",
        "task.completed": "task_completed",
        "task.updated": "task_updated",
        "asset.position_updated": "asset_position_updated",
        "asset.status_changed": "asset_status_changed",
        "alert.created": "alert_created",
        "alert.acknowledged": "alert_acknowledged",
    }

    def __init__(
        self,
        bootstrap_servers: str,
        sio: socketio.AsyncServer,
        group_id: str = "websocket-service",
        topics: Optional[List[str]] = None
    ):
        """
        Initialize Kafka consumer.

        Args:
            bootstrap_servers: Kafka bootstrap servers (comma-separated)
            sio: Socket.IO server instance
            group_id: Consumer group ID
            topics: List of topics to consume (defaults to all event topics)
        """
        self.bootstrap_servers = bootstrap_servers.split(",")
        self.sio = sio
        self.group_id = group_id
        self.topics = topics or [
            "radio.events.transmission",
            "radio.events.transcription",
            "radio.events.incident",
            "radio.events.task",
            "radio.events.asset",
            "radio.events.alert",
        ]
        self.consumer: Optional[AIOKafkaConsumer] = None
        self.running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Start the Kafka consumer."""
        if self.running:
            logger.warning("Kafka consumer already running")
            return

        try:
            # Create consumer instance
            self.consumer = AIOKafkaConsumer(
                *self.topics,
                bootstrap_servers=self.bootstrap_servers,
                group_id=self.group_id,
                auto_offset_reset="latest",  # Start from latest messages
                enable_auto_commit=True,
                auto_commit_interval_ms=5000,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")) if m else None,
                key_deserializer=lambda k: k.decode("utf-8") if k else None,
                session_timeout_ms=30000,
                heartbeat_interval_ms=10000,
                max_poll_records=100,
                max_poll_interval_ms=300000,
            )

            # Start consumer
            await self.consumer.start()
            self.running = True
            logger.info(f"Kafka consumer started, subscribed to topics: {', '.join(self.topics)}")

            # Start consumption loop
            self._task = asyncio.create_task(self._consume_loop())

        except KafkaConnectionError as e:
            logger.error(f"Failed to connect to Kafka: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error starting Kafka consumer: {str(e)}")
            raise

    async def stop(self) -> None:
        """Stop the Kafka consumer gracefully."""
        if not self.running:
            return

        logger.info("Stopping Kafka consumer...")
        self.running = False

        # Cancel consumption task
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        # Stop consumer
        if self.consumer:
            try:
                await self.consumer.stop()
                logger.info("Kafka consumer stopped")
            except Exception as e:
                logger.error(f"Error stopping Kafka consumer: {str(e)}")

    async def _consume_loop(self) -> None:
        """Main consumption loop."""
        consecutive_errors = 0
        max_consecutive_errors = 10

        while self.running:
            try:
                # Fetch messages
                async for message in self.consumer:
                    if not self.running:
                        break

                    # Process message
                    await self._process_message(message)
                    consecutive_errors = 0  # Reset error counter on success

            except KafkaConnectionError as e:
                consecutive_errors += 1
                logger.error(
                    f"Kafka connection error ({consecutive_errors}/{max_consecutive_errors}): {str(e)}"
                )

                if consecutive_errors >= max_consecutive_errors:
                    logger.critical("Too many consecutive Kafka errors, stopping consumer")
                    self.running = False
                    break

                # Exponential backoff
                await asyncio.sleep(min(2 ** consecutive_errors, 60))

            except asyncio.CancelledError:
                logger.info("Kafka consumer loop cancelled")
                break

            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Error in Kafka consumer loop: {str(e)}", exc_info=True)

                if consecutive_errors >= max_consecutive_errors:
                    logger.critical("Too many consecutive errors, stopping consumer")
                    self.running = False
                    break

                await asyncio.sleep(5)

    async def _process_message(self, message: ConsumerRecord) -> None:
        """
        Process a Kafka message and broadcast to appropriate rooms.

        Args:
            message: Kafka message record
        """
        try:
            # Extract event data
            event_type = message.key
            event_data = message.value

            if not event_type or not event_data:
                logger.warning(f"Received message with missing key or value on topic {message.topic}")
                return

            # Map to Socket.IO event name
            socket_event = self.EVENT_MAPPINGS.get(event_type)
            if not socket_event:
                logger.debug(f"No mapping for event type: {event_type}")
                return

            # Determine target rooms
            rooms = self._get_target_rooms(event_type, event_data)

            # Broadcast to rooms
            for room in rooms:
                try:
                    await self.sio.emit(
                        socket_event,
                        event_data,
                        room=room
                    )
                    logger.debug(f"Broadcasted {socket_event} to room {room}")
                except Exception as e:
                    logger.error(f"Error broadcasting to room {room}: {str(e)}")

            # Also broadcast to global organization room if applicable
            org_id = event_data.get("organization_id")
            if org_id:
                org_room = f"org:{org_id}"
                try:
                    await self.sio.emit(
                        socket_event,
                        event_data,
                        room=org_room
                    )
                except Exception as e:
                    logger.error(f"Error broadcasting to org room {org_room}: {str(e)}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode message value: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)

    def _get_target_rooms(self, event_type: str, event_data: Dict[str, Any]) -> List[str]:
        """
        Determine which rooms should receive this event.

        Args:
            event_type: Type of event
            event_data: Event payload

        Returns:
            List of room identifiers
        """
        rooms = []

        try:
            org_id = event_data.get("organization_id")
            if not org_id:
                return rooms

            # Transmission events -> channel rooms
            if event_type.startswith("transmission.") or event_type.startswith("transcription."):
                channel_id = event_data.get("channel_id")
                if channel_id:
                    rooms.append(f"channel:{channel_id}:org:{org_id}")

                # Also add to incident room if linked to incident
                incident_id = event_data.get("incident_id")
                if incident_id:
                    rooms.append(f"incident:{incident_id}:org:{org_id}")

            # Incident events -> incident rooms
            elif event_type.startswith("incident."):
                incident_id = event_data.get("incident_id") or event_data.get("id")
                if incident_id:
                    rooms.append(f"incident:{incident_id}:org:{org_id}")

            # Task events -> incident rooms (tasks are incident-scoped)
            elif event_type.startswith("task."):
                incident_id = event_data.get("incident_id")
                if incident_id:
                    rooms.append(f"incident:{incident_id}:org:{org_id}")

            # Asset events -> asset tracking room and incident rooms if applicable
            elif event_type.startswith("asset."):
                asset_id = event_data.get("asset_id") or event_data.get("id")
                if asset_id:
                    rooms.append(f"asset:{asset_id}:org:{org_id}")

                # If asset is assigned to incident
                incident_id = event_data.get("incident_id")
                if incident_id:
                    rooms.append(f"incident:{incident_id}:org:{org_id}")

            # Alert events -> organization-wide
            elif event_type.startswith("alert."):
                rooms.append(f"org:{org_id}")

        except Exception as e:
            logger.error(f"Error determining target rooms: {str(e)}")

        return rooms

    async def health_check(self) -> Dict[str, Any]:
        """
        Get health status of the Kafka consumer.

        Returns:
            Dict with health status information
        """
        return {
            "running": self.running,
            "connected": self.consumer is not None and not self.consumer._closed,
            "topics": self.topics,
            "group_id": self.group_id,
        }


class KafkaEventProducer:
    """
    Optional: Kafka producer for sending client-initiated events.
    Used when WebSocket clients need to publish events back to Kafka.
    """

    def __init__(self, bootstrap_servers: str):
        """
        Initialize Kafka producer.

        Args:
            bootstrap_servers: Kafka bootstrap servers (comma-separated)
        """
        from aiokafka import AIOKafkaProducer

        self.bootstrap_servers = bootstrap_servers.split(",")
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self) -> None:
        """Start the Kafka producer."""
        from aiokafka import AIOKafkaProducer

        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )
        await self.producer.start()
        logger.info("Kafka producer started")

    async def stop(self) -> None:
        """Stop the Kafka producer."""
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka producer stopped")

    async def send_event(self, topic: str, event_type: str, event_data: Dict[str, Any]) -> None:
        """
        Send an event to Kafka.

        Args:
            topic: Kafka topic
            event_type: Event type (used as message key)
            event_data: Event payload
        """
        if not self.producer:
            raise RuntimeError("Producer not started")

        try:
            await self.producer.send_and_wait(topic, event_data, key=event_type)
            logger.debug(f"Sent event {event_type} to topic {topic}")
        except Exception as e:
            logger.error(f"Error sending event to Kafka: {str(e)}")
            raise
