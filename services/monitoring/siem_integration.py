"""
SIEM Integration
Integration with Security Information and Event Management systems

Supports:
- Azure Sentinel
- Splunk
- Generic SIEM via syslog/CEF
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import json
import socket
import httpx
from azure.identity import DefaultAzureCredential
from azure.monitor.ingestion import LogsIngestionClient
from azure.core.exceptions import HttpResponseError
import os

from security_monitor import SecurityEvent, SecuritySeverity, SecurityEventType

logger = logging.getLogger(__name__)


class SIEMType(str, Enum):
    """SIEM system types"""
    AZURE_SENTINEL = "azure_sentinel"
    SPLUNK = "splunk"
    SYSLOG = "syslog"
    CEF = "cef"


class SIEMIntegration:
    """Base class for SIEM integrations"""

    async def send_event(self, event: SecurityEvent):
        """Send event to SIEM"""
        raise NotImplementedError

    async def send_events(self, events: List[SecurityEvent]):
        """Send multiple events to SIEM"""
        for event in events:
            await self.send_event(event)

    async def query_events(
        self,
        start_time: datetime,
        end_time: datetime,
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Query events from SIEM"""
        raise NotImplementedError


class AzureSentinelIntegration(SIEMIntegration):
    """Azure Sentinel integration"""

    def __init__(
        self,
        workspace_id: Optional[str] = None,
        data_collection_endpoint: Optional[str] = None,
        data_collection_rule_id: Optional[str] = None,
        stream_name: str = "Custom-SecurityEvents_CL"
    ):
        """
        Initialize Azure Sentinel integration

        Args:
            workspace_id: Log Analytics workspace ID
            data_collection_endpoint: Data Collection Endpoint URL
            data_collection_rule_id: Data Collection Rule ID
            stream_name: Stream name for custom logs
        """
        self.workspace_id = workspace_id or os.getenv("AZURE_SENTINEL_WORKSPACE_ID")
        self.data_collection_endpoint = data_collection_endpoint or os.getenv("AZURE_SENTINEL_DCE")
        self.data_collection_rule_id = data_collection_rule_id or os.getenv("AZURE_SENTINEL_DCR_ID")
        self.stream_name = stream_name

        if not all([self.workspace_id, self.data_collection_endpoint, self.data_collection_rule_id]):
            logger.warning("Azure Sentinel not fully configured")
            self.enabled = False
        else:
            self.enabled = True

        self.credential = DefaultAzureCredential() if self.enabled else None
        self.client: Optional[LogsIngestionClient] = None

        if self.enabled:
            try:
                self.client = LogsIngestionClient(
                    endpoint=self.data_collection_endpoint,
                    credential=self.credential
                )
                logger.info("Azure Sentinel integration initialized")
            except Exception as e:
                logger.error(f"Error initializing Azure Sentinel client: {e}")
                self.enabled = False

    async def send_event(self, event: SecurityEvent):
        """Send event to Azure Sentinel"""
        if not self.enabled or not self.client:
            logger.debug("Azure Sentinel not enabled, skipping")
            return

        try:
            # Convert event to Sentinel format
            sentinel_event = self._convert_to_sentinel_format(event)

            # Send to Sentinel
            await asyncio.to_thread(
                self.client.upload,
                rule_id=self.data_collection_rule_id,
                stream_name=self.stream_name,
                logs=[sentinel_event]
            )

            logger.debug(f"Sent event to Azure Sentinel: {event.event_type.value}")

        except HttpResponseError as e:
            logger.error(f"Error sending event to Azure Sentinel: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Unexpected error sending to Sentinel: {e}", exc_info=True)

    async def send_events(self, events: List[SecurityEvent]):
        """Send multiple events to Azure Sentinel (batched)"""
        if not self.enabled or not self.client:
            logger.debug("Azure Sentinel not enabled, skipping")
            return

        if not events:
            return

        try:
            # Convert events to Sentinel format
            sentinel_events = [
                self._convert_to_sentinel_format(event)
                for event in events
            ]

            # Send batch to Sentinel
            await asyncio.to_thread(
                self.client.upload,
                rule_id=self.data_collection_rule_id,
                stream_name=self.stream_name,
                logs=sentinel_events
            )

            logger.info(f"Sent {len(events)} events to Azure Sentinel")

        except HttpResponseError as e:
            logger.error(f"Error sending events to Azure Sentinel: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Unexpected error sending to Sentinel: {e}", exc_info=True)

    def _convert_to_sentinel_format(self, event: SecurityEvent) -> Dict[str, Any]:
        """Convert SecurityEvent to Azure Sentinel format"""
        return {
            "TimeGenerated": event.timestamp.isoformat(),
            "EventType": event.event_type.value,
            "Severity": event.severity.value,
            "UserId": event.user_id or "",
            "Username": event.username or "",
            "IPAddress": event.ip_address or "",
            "UserAgent": event.user_agent or "",
            "Endpoint": event.endpoint or "",
            "Method": event.method or "",
            "Resource": event.resource or "",
            "SessionId": event.session_id or "",
            "OrganizationId": event.organization_id or "",
            "Details": json.dumps(event.details),
            "Geolocation": json.dumps(event.geolocation) if event.geolocation else "",
            "Source": "CTAFleet-SecurityMonitor"
        }

    async def query_events(
        self,
        start_time: datetime,
        end_time: datetime,
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Query events from Azure Sentinel"""
        # This would use Azure Monitor Query API
        # Placeholder implementation
        logger.info("Querying Azure Sentinel (not implemented)")
        return []


class SplunkIntegration(SIEMIntegration):
    """Splunk integration via HTTP Event Collector"""

    def __init__(
        self,
        hec_url: Optional[str] = None,
        hec_token: Optional[str] = None,
        index: str = "security"
    ):
        """
        Initialize Splunk integration

        Args:
            hec_url: HTTP Event Collector URL
            hec_token: HEC token
            index: Splunk index
        """
        self.hec_url = hec_url or os.getenv("SPLUNK_HEC_URL")
        self.hec_token = hec_token or os.getenv("SPLUNK_HEC_TOKEN")
        self.index = index

        if not all([self.hec_url, self.hec_token]):
            logger.warning("Splunk not fully configured")
            self.enabled = False
        else:
            self.enabled = True

        self.http_client: Optional[httpx.AsyncClient] = None

        if self.enabled:
            self.http_client = httpx.AsyncClient(
                timeout=30.0,
                headers={
                    "Authorization": f"Splunk {self.hec_token}",
                    "Content-Type": "application/json"
                }
            )
            logger.info("Splunk integration initialized")

    async def send_event(self, event: SecurityEvent):
        """Send event to Splunk"""
        if not self.enabled or not self.http_client:
            logger.debug("Splunk not enabled, skipping")
            return

        try:
            # Convert event to Splunk format
            splunk_event = {
                "time": event.timestamp.timestamp(),
                "source": "ctafleet-security-monitor",
                "sourcetype": "security:event",
                "index": self.index,
                "event": event.to_dict()
            }

            # Send to Splunk HEC
            response = await self.http_client.post(
                f"{self.hec_url}/services/collector/event",
                json=splunk_event
            )
            response.raise_for_status()

            logger.debug(f"Sent event to Splunk: {event.event_type.value}")

        except httpx.HTTPError as e:
            logger.error(f"Error sending event to Splunk: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Unexpected error sending to Splunk: {e}", exc_info=True)

    async def send_events(self, events: List[SecurityEvent]):
        """Send multiple events to Splunk (batched)"""
        if not self.enabled or not self.http_client:
            logger.debug("Splunk not enabled, skipping")
            return

        if not events:
            return

        try:
            # Convert events to Splunk format
            splunk_events = [
                {
                    "time": event.timestamp.timestamp(),
                    "source": "ctafleet-security-monitor",
                    "sourcetype": "security:event",
                    "index": self.index,
                    "event": event.to_dict()
                }
                for event in events
            ]

            # Send batch to Splunk (multiple events in one request)
            batch_payload = "\n".join([json.dumps(e) for e in splunk_events])

            response = await self.http_client.post(
                f"{self.hec_url}/services/collector/event",
                content=batch_payload
            )
            response.raise_for_status()

            logger.info(f"Sent {len(events)} events to Splunk")

        except httpx.HTTPError as e:
            logger.error(f"Error sending events to Splunk: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Unexpected error sending to Splunk: {e}", exc_info=True)

    async def close(self):
        """Close HTTP client"""
        if self.http_client:
            await self.http_client.aclose()


class SyslogIntegration(SIEMIntegration):
    """Syslog integration (RFC 5424)"""

    def __init__(
        self,
        syslog_host: Optional[str] = None,
        syslog_port: int = 514,
        protocol: str = "udp",
        facility: int = 13  # Log audit
    ):
        """
        Initialize Syslog integration

        Args:
            syslog_host: Syslog server host
            syslog_port: Syslog server port
            protocol: Protocol (udp or tcp)
            facility: Syslog facility code
        """
        self.syslog_host = syslog_host or os.getenv("SYSLOG_HOST")
        self.syslog_port = syslog_port
        self.protocol = protocol
        self.facility = facility

        if not self.syslog_host:
            logger.warning("Syslog host not configured")
            self.enabled = False
        else:
            self.enabled = True
            logger.info(f"Syslog integration initialized: {self.syslog_host}:{self.syslog_port}")

        self.socket: Optional[socket.socket] = None

    async def send_event(self, event: SecurityEvent):
        """Send event to Syslog"""
        if not self.enabled:
            logger.debug("Syslog not enabled, skipping")
            return

        try:
            # Map severity to syslog priority
            severity_map = {
                SecuritySeverity.LOW: 6,  # Informational
                SecuritySeverity.MEDIUM: 5,  # Notice
                SecuritySeverity.HIGH: 4,  # Warning
                SecuritySeverity.CRITICAL: 2  # Critical
            }

            syslog_severity = severity_map.get(event.severity, 5)
            priority = (self.facility * 8) + syslog_severity

            # Format syslog message (RFC 5424)
            timestamp = event.timestamp.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            hostname = socket.gethostname()
            app_name = "ctafleet-security"
            msg_id = event.event_type.value

            # Structured data
            structured_data = f'[security@ctafleet user="{event.username or "-"}" ip="{event.ip_address or "-"}" severity="{event.severity.value}"]'

            # Message
            message = f"<{priority}>1 {timestamp} {hostname} {app_name} - {msg_id} {structured_data} {json.dumps(event.to_dict())}"

            # Send
            await self._send_syslog(message)

            logger.debug(f"Sent event to Syslog: {event.event_type.value}")

        except Exception as e:
            logger.error(f"Error sending event to Syslog: {e}", exc_info=True)

    async def _send_syslog(self, message: str):
        """Send syslog message"""
        try:
            if self.protocol == "udp":
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                await asyncio.to_thread(
                    sock.sendto,
                    message.encode('utf-8'),
                    (self.syslog_host, self.syslog_port)
                )
                sock.close()
            else:  # TCP
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                await asyncio.to_thread(sock.connect, (self.syslog_host, self.syslog_port))
                await asyncio.to_thread(sock.sendall, message.encode('utf-8'))
                sock.close()

        except Exception as e:
            logger.error(f"Error sending syslog message: {e}")


class SIEMManager:
    """Manage multiple SIEM integrations"""

    def __init__(self):
        """Initialize SIEM manager"""
        self.integrations: List[SIEMIntegration] = []
        self.enabled = False

        # Initialize configured integrations
        self._initialize_integrations()

    def _initialize_integrations(self):
        """Initialize configured SIEM integrations"""
        # Azure Sentinel
        if os.getenv("AZURE_SENTINEL_ENABLED", "false").lower() == "true":
            try:
                sentinel = AzureSentinelIntegration()
                if sentinel.enabled:
                    self.integrations.append(sentinel)
                    self.enabled = True
                    logger.info("Azure Sentinel integration added")
            except Exception as e:
                logger.error(f"Error initializing Azure Sentinel: {e}")

        # Splunk
        if os.getenv("SPLUNK_ENABLED", "false").lower() == "true":
            try:
                splunk = SplunkIntegration()
                if splunk.enabled:
                    self.integrations.append(splunk)
                    self.enabled = True
                    logger.info("Splunk integration added")
            except Exception as e:
                logger.error(f"Error initializing Splunk: {e}")

        # Syslog
        if os.getenv("SYSLOG_ENABLED", "false").lower() == "true":
            try:
                syslog = SyslogIntegration()
                if syslog.enabled:
                    self.integrations.append(syslog)
                    self.enabled = True
                    logger.info("Syslog integration added")
            except Exception as e:
                logger.error(f"Error initializing Syslog: {e}")

        if not self.enabled:
            logger.warning("No SIEM integrations configured")

    async def send_event(self, event: SecurityEvent):
        """Send event to all configured SIEMs"""
        if not self.enabled:
            return

        tasks = [
            integration.send_event(event)
            for integration in self.integrations
        ]

        await asyncio.gather(*tasks, return_exceptions=True)

    async def send_events(self, events: List[SecurityEvent]):
        """Send events to all configured SIEMs"""
        if not self.enabled:
            return

        tasks = [
            integration.send_events(events)
            for integration in self.integrations
        ]

        await asyncio.gather(*tasks, return_exceptions=True)

    def get_integrations(self) -> List[str]:
        """Get list of active integrations"""
        return [
            integration.__class__.__name__
            for integration in self.integrations
        ]


# Global SIEM manager instance
_siem_manager: Optional[SIEMManager] = None


def get_siem_manager() -> SIEMManager:
    """Get or create the global SIEM manager instance"""
    global _siem_manager
    if _siem_manager is None:
        _siem_manager = SIEMManager()
    return _siem_manager
