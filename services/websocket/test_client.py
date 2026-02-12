#!/usr/bin/env python3
"""
Test client for WebSocket service.
Connects to the WebSocket service and subscribes to rooms.
"""
import asyncio
import sys
import json
from datetime import datetime
import socketio


class WebSocketTestClient:
    """Test client for WebSocket service."""

    def __init__(self, url: str, token: str):
        """
        Initialize test client.

        Args:
            url: WebSocket service URL
            token: JWT token for authentication
        """
        self.url = url
        self.token = token
        self.sio = socketio.AsyncClient(
            logger=False,
            engineio_logger=False
        )
        self._setup_handlers()

    def _setup_handlers(self):
        """Set up Socket.IO event handlers."""

        @self.sio.event
        async def connect():
            print(f"[{self._timestamp()}] ✅ Connected: {self.sio.sid}")

        @self.sio.event
        async def disconnect():
            print(f"[{self._timestamp()}] ❌ Disconnected")

        @self.sio.event
        async def connect_error(data):
            print(f"[{self._timestamp()}] ❌ Connection error: {data}")

        @self.sio.event
        async def error(data):
            print(f"[{self._timestamp()}] ❌ Error: {data}")

        @self.sio.event
        async def subscribed(data):
            print(f"[{self._timestamp()}] ✅ Subscribed to room: {data['room']}")

        @self.sio.event
        async def unsubscribed(data):
            print(f"[{self._timestamp()}] ℹ️  Unsubscribed from room: {data['room']}")

        @self.sio.event
        async def pong(data):
            print(f"[{self._timestamp()}] 🏓 Pong: {data}")

        # Event handlers for all event types
        event_types = [
            "transmission_started",
            "transmission_completed",
            "transcription_completed",
            "transmission_tagged",
            "incident_created",
            "incident_updated",
            "incident_status_changed",
            "task_assigned",
            "task_completed",
            "task_updated",
            "asset_position_updated",
            "asset_status_changed",
            "alert_created",
            "alert_acknowledged",
        ]

        for event_type in event_types:
            self._register_event_handler(event_type)

    def _register_event_handler(self, event_type: str):
        """Register a handler for a specific event type."""

        async def handler(data):
            print(f"\n[{self._timestamp()}] 📡 {event_type}")
            print(json.dumps(data, indent=2))
            print()

        self.sio.on(event_type, handler)

    def _timestamp(self) -> str:
        """Get current timestamp string."""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    async def connect(self) -> bool:
        """
        Connect to WebSocket service.

        Returns:
            True if connected successfully
        """
        try:
            await self.sio.connect(
                self.url,
                auth={"token": self.token},
                transports=["websocket", "polling"],
            )
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {str(e)}")
            return False

    async def disconnect(self):
        """Disconnect from WebSocket service."""
        await self.sio.disconnect()

    async def subscribe(self, room: str):
        """
        Subscribe to a room.

        Args:
            room: Room identifier
        """
        await self.sio.emit("subscribe", {"room": room})

    async def unsubscribe(self, room: str):
        """
        Unsubscribe from a room.

        Args:
            room: Room identifier
        """
        await self.sio.emit("unsubscribe", {"room": room})

    async def ping(self):
        """Send ping to server."""
        await self.sio.emit("ping")

    async def wait(self):
        """Wait for events indefinitely."""
        await self.sio.wait()


async def main():
    """Main test client function."""
    import argparse

    parser = argparse.ArgumentParser(description="WebSocket Test Client")
    parser.add_argument(
        "--url",
        default="http://localhost:8001",
        help="WebSocket service URL (default: http://localhost:8001)",
    )
    parser.add_argument(
        "--token",
        required=True,
        help="JWT token for authentication",
    )
    parser.add_argument(
        "--rooms",
        nargs="+",
        help="Rooms to subscribe to (e.g., channel:123:org:456)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        help="Duration to run in seconds (default: run until interrupted)",
    )

    args = parser.parse_args()

    print("=" * 60)
    print("WebSocket Test Client")
    print("=" * 60)
    print(f"URL: {args.url}")
    print(f"Rooms: {args.rooms or 'None (org room only)'}")
    print("=" * 60)
    print()

    # Create client
    client = WebSocketTestClient(args.url, args.token)

    # Connect
    if not await client.connect():
        sys.exit(1)

    try:
        # Wait for connection to establish
        await asyncio.sleep(1)

        # Subscribe to rooms
        if args.rooms:
            for room in args.rooms:
                await client.subscribe(room)
                await asyncio.sleep(0.5)

        print("\n✅ Client ready. Listening for events...")
        print("Press Ctrl+C to exit\n")

        # Run for specified duration or until interrupted
        if args.duration:
            await asyncio.sleep(args.duration)
        else:
            # Wait indefinitely
            while True:
                await asyncio.sleep(1)

    except KeyboardInterrupt:
        print("\n\n⏹️  Interrupted by user")
    finally:
        await client.disconnect()
        print("👋 Disconnected")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
