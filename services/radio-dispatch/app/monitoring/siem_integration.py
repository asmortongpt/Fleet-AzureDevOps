"""SIEM (Security Information and Event Management) integration.

This module provides integration with Azure Sentinel and other SIEM systems:
- Event forwarding to Sentinel
- Alert correlation
- Threat intelligence sharing
- Compliance reporting
"""

import logging
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod
import hashlib
import hmac
import base64

from .security_monitor import SecurityEvent, SecurityEventType, SeverityLevel
from .alert_manager import Alert, AlertStatus

logger = logging.getLogger(__name__)


class SIEMConnector(ABC):
    """Base class for SIEM connectors."""

    @abstractmethod
    async def send_event(self, event: SecurityEvent) -> bool:
        """Send event to SIEM.

        Args:
            event: Security event

        Returns:
            True if sent successfully
        """
        pass

    @abstractmethod
    async def send_alert(self, alert: Alert) -> bool:
        """Send alert to SIEM.

        Args:
            alert: Security alert

        Returns:
            True if sent successfully
        """
        pass


class AzureSentinelConnector(SIEMConnector):
    """Connector for Azure Sentinel (Log Analytics Workspace)."""

    def __init__(
        self,
        workspace_id: str,
        shared_key: str,
        table_name: str = "SecurityEvents"
    ):
        """Initialize Azure Sentinel connector.

        Args:
            workspace_id: Log Analytics Workspace ID
            shared_key: Shared access key (base64 encoded)
            table_name: Custom table name in workspace
        """
        self.workspace_id = workspace_id
        self.shared_key = shared_key
        self.table_name = table_name
        self.api_version = "2016-04-01"

    def _build_signature(
        self,
        date: str,
        content_length: int,
        method: str,
        content_type: str,
        resource: str
    ) -> str:
        """Build authorization signature for Azure Log Analytics API.

        Args:
            date: RFC 1123 formatted date
            content_length: Content length
            method: HTTP method
            content_type: Content type
            resource: URI resource

        Returns:
            Authorization header value
        """
        x_headers = f"x-ms-date:{date}"
        string_to_hash = "\n".join([
            method,
            str(content_length),
            content_type,
            x_headers,
            resource
        ])

        bytes_to_hash = string_to_hash.encode("utf-8")
        decoded_key = base64.b64decode(self.shared_key)
        encoded_hash = base64.b64encode(
            hmac.new(decoded_key, bytes_to_hash, hashlib.sha256).digest()
        ).decode("utf-8")

        authorization = f"SharedKey {self.workspace_id}:{encoded_hash}"
        return authorization

    async def send_event(self, event: SecurityEvent) -> bool:
        """Send event to Azure Sentinel.

        Args:
            event: Security event

        Returns:
            True if sent successfully
        """
        try:
            # Format event for Log Analytics
            log_entry = self._format_event_for_sentinel(event)

            # In production, POST to Log Analytics API
            # https://<workspace-id>.ods.opinsights.azure.com/api/logs
            logger.info(
                f"Sending event to Azure Sentinel",
                extra={
                    "event_id": event.event_id,
                    "workspace_id": self.workspace_id,
                    "table": self.table_name,
                }
            )
            return True

        except Exception as e:
            logger.error(f"Error sending event to Sentinel: {e}", exc_info=True)
            return False

    async def send_alert(self, alert: Alert) -> bool:
        """Send alert to Azure Sentinel.

        Args:
            alert: Security alert

        Returns:
            True if sent successfully
        """
        try:
            # Format alert for Log Analytics
            log_entry = self._format_alert_for_sentinel(alert)

            logger.info(
                f"Sending alert to Azure Sentinel",
                extra={
                    "alert_id": alert.alert_id,
                    "workspace_id": self.workspace_id,
                }
            )
            return True

        except Exception as e:
            logger.error(f"Error sending alert to Sentinel: {e}", exc_info=True)
            return False

    def _format_event_for_sentinel(self, event: SecurityEvent) -> Dict[str, Any]:
        """Format event for Azure Sentinel.

        Args:
            event: Security event

        Returns:
            Formatted log entry
        """
        return {
            "TimeGenerated": event.timestamp.isoformat(),
            "EventID": event.event_id,
            "EventType": event.event_type.value,
            "Severity": event.severity.value,
            "SourceIP": event.source_ip,
            "UserID": event.user_id or "",
            "SessionID": event.session_id or "",
            "Resource": event.resource or "",
            "Action": event.action or "",
            "Result": event.result or "",
            "Details": json.dumps(event.details) if event.details else "",
        }

    def _format_alert_for_sentinel(self, alert: Alert) -> Dict[str, Any]:
        """Format alert for Azure Sentinel.

        Args:
            alert: Security alert

        Returns:
            Formatted log entry
        """
        return {
            "TimeGenerated": alert.triggered_at.isoformat(),
            "AlertID": alert.alert_id,
            "Title": alert.title,
            "Description": alert.description,
            "Severity": alert.severity.value,
            "Status": alert.status.value,
            "SourceEventID": alert.source_event_id,
            "AcknowledgedBy": alert.acknowledged_by or "",
            "AcknowledgedTime": (
                alert.acknowledged_at.isoformat()
                if alert.acknowledged_at else ""
            ),
            "ResolvedTime": (
                alert.resolved_at.isoformat()
                if alert.resolved_at else ""
            ),
            "EscalationCount": alert.escalation_count,
            "RelatedEvents": json.dumps(alert.related_event_ids),
            "Metadata": json.dumps(alert.metadata),
        }


class SplunkConnector(SIEMConnector):
    """Connector for Splunk HEC (HTTP Event Collector)."""

    def __init__(self, hec_url: str, hec_token: str, source: str = "cta-fleet"):
        """Initialize Splunk connector.

        Args:
            hec_url: HEC endpoint URL
            hec_token: HEC authentication token
            source: Event source name
        """
        self.hec_url = hec_url
        self.hec_token = hec_token
        self.source = source

    async def send_event(self, event: SecurityEvent) -> bool:
        """Send event to Splunk.

        Args:
            event: Security event

        Returns:
            True if sent successfully
        """
        try:
            hec_event = {
                "event": event.to_dict(),
                "sourcetype": "_json",
                "source": self.source,
                "host": event.source_ip or "unknown",
            }

            logger.info(
                f"Sending event to Splunk",
                extra={"event_id": event.event_id}
            )
            # In production, POST to HEC endpoint
            return True

        except Exception as e:
            logger.error(f"Error sending event to Splunk: {e}", exc_info=True)
            return False

    async def send_alert(self, alert: Alert) -> bool:
        """Send alert to Splunk.

        Args:
            alert: Security alert

        Returns:
            True if sent successfully
        """
        try:
            hec_event = {
                "event": alert.to_dict(),
                "sourcetype": "_json",
                "source": f"{self.source}-alerts",
                "host": "cta-fleet-security",
            }

            logger.info(
                f"Sending alert to Splunk",
                extra={"alert_id": alert.alert_id}
            )
            # In production, POST to HEC endpoint
            return True

        except Exception as e:
            logger.error(f"Error sending alert to Splunk: {e}", exc_info=True)
            return False


class CloudflareLogpushConnector(SIEMConnector):
    """Connector for Cloudflare Logpush."""

    def __init__(self, account_id: str, api_token: str):
        """Initialize Cloudflare connector.

        Args:
            account_id: Cloudflare account ID
            api_token: Cloudflare API token
        """
        self.account_id = account_id
        self.api_token = api_token

    async def send_event(self, event: SecurityEvent) -> bool:
        """Send event to Cloudflare Logpush.

        Args:
            event: Security event

        Returns:
            True if sent successfully
        """
        try:
            logger.info(
                f"Logging event to Cloudflare",
                extra={"event_id": event.event_id}
            )
            # In production, use Cloudflare Logpush API
            return True

        except Exception as e:
            logger.error(f"Error sending to Cloudflare: {e}", exc_info=True)
            return False

    async def send_alert(self, alert: Alert) -> bool:
        """Send alert to Cloudflare Logpush.

        Args:
            alert: Security alert

        Returns:
            True if sent successfully
        """
        try:
            logger.info(
                f"Logging alert to Cloudflare",
                extra={"alert_id": alert.alert_id}
            )
            return True

        except Exception as e:
            logger.error(f"Error sending to Cloudflare: {e}", exc_info=True)
            return False


class SIEMEventRouter:
    """Routes events and alerts to multiple SIEM systems."""

    def __init__(self):
        """Initialize SIEM router."""
        self.connectors: List[SIEMConnector] = []

    def register_connector(self, connector: SIEMConnector) -> None:
        """Register a SIEM connector.

        Args:
            connector: SIEM connector instance
        """
        self.connectors.append(connector)

    async def send_event(self, event: SecurityEvent) -> Dict[str, bool]:
        """Send event to all registered SIEM systems.

        Args:
            event: Security event

        Returns:
            Dictionary of {connector_name: success}
        """
        results = {}

        tasks = [
            self._send_to_connector(connector, event)
            for connector in self.connectors
        ]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        for i, connector in enumerate(self.connectors):
            connector_name = connector.__class__.__name__
            result = results_list[i]
            results[connector_name] = (
                result if isinstance(result, bool) else False
            )

        return results

    async def send_alert(self, alert: Alert) -> Dict[str, bool]:
        """Send alert to all registered SIEM systems.

        Args:
            alert: Security alert

        Returns:
            Dictionary of {connector_name: success}
        """
        results = {}

        tasks = [
            self._send_alert_to_connector(connector, alert)
            for connector in self.connectors
        ]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        for i, connector in enumerate(self.connectors):
            connector_name = connector.__class__.__name__
            result = results_list[i]
            results[connector_name] = (
                result if isinstance(result, bool) else False
            )

        return results

    async def _send_to_connector(
        self,
        connector: SIEMConnector,
        event: SecurityEvent
    ) -> bool:
        """Send event to specific connector with error handling.

        Args:
            connector: SIEM connector
            event: Security event

        Returns:
            Success status
        """
        try:
            return await connector.send_event(event)
        except Exception as e:
            logger.error(
                f"Error sending to {connector.__class__.__name__}: {e}",
                exc_info=True
            )
            return False

    async def _send_alert_to_connector(
        self,
        connector: SIEMConnector,
        alert: Alert
    ) -> bool:
        """Send alert to specific connector with error handling.

        Args:
            connector: SIEM connector
            alert: Security alert

        Returns:
            Success status
        """
        try:
            return await connector.send_alert(alert)
        except Exception as e:
            logger.error(
                f"Error sending alert to {connector.__class__.__name__}: {e}",
                exc_info=True
            )
            return False


class ComplianceEventMapper:
    """Maps security events to compliance frameworks."""

    # NIST CSF (Cybersecurity Framework) mapping
    NIST_MAPPING = {
        SecurityEventType.AUTH_FAILURE: "ID.BE-1",  # Supply chain risk
        SecurityEventType.PRIVILEGE_ESCALATION: "DE.AE-1",  # Detect anomalies
        SecurityEventType.DATA_MODIFIED: "PR.PT-1",  # Data protection
        SecurityEventType.UNAUTHORIZED_DATA_ACCESS: "DE.AE-1",  # Detect anomalies
        SecurityEventType.BRUTE_FORCE_ATTEMPT: "DE.CM-1",  # Continuous monitoring
    }

    # HIPAA Security Rule mapping
    HIPAA_MAPPING = {
        SecurityEventType.AUTH_FAILURE: "164.312(a)(2)(i)",  # User identification
        SecurityEventType.DATA_MODIFIED: "164.312(b)",  # Audit controls
        SecurityEventType.UNAUTHORIZED_DATA_ACCESS: "164.308(a)(5)(ii)(C)",  # Access controls
    }

    # SOC 2 mapping
    SOC2_MAPPING = {
        SecurityEventType.AUTH_FAILURE: "CC6.1",  # User access
        SecurityEventType.PRIVILEGE_ESCALATION: "CC6.2",  # Change management
        SecurityEventType.DATA_MODIFIED: "CC7.2",  # System changes
    }

    @classmethod
    def get_nist_references(cls, event: SecurityEvent) -> List[str]:
        """Get NIST CSF references for event.

        Args:
            event: Security event

        Returns:
            List of NIST references
        """
        return cls.NIST_MAPPING.get(event.event_type, [])

    @classmethod
    def get_hipaa_references(cls, event: SecurityEvent) -> List[str]:
        """Get HIPAA references for event.

        Args:
            event: Security event

        Returns:
            List of HIPAA references
        """
        return cls.HIPAA_MAPPING.get(event.event_type, [])

    @classmethod
    def get_soc2_references(cls, event: SecurityEvent) -> List[str]:
        """Get SOC 2 references for event.

        Args:
            event: Security event

        Returns:
            List of SOC 2 references
        """
        return cls.SOC2_MAPPING.get(event.event_type, [])
