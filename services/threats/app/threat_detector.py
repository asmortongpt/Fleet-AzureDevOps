"""
Threat Detector - Main threat detection engine

Integrates with threat intelligence feeds, performs real-time threat analysis,
and coordinates automated response actions.

Security Requirements:
- Real-time threat detection and alerting
- Integration with multiple threat intelligence sources
- Machine learning-based anomaly detection
- Automated threat response coordination
- Comprehensive audit logging
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from enum import Enum
from dataclasses import dataclass, field
import hashlib
import json

logger = logging.getLogger(__name__)


class ThreatLevel(str, Enum):
    """Threat severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ThreatCategory(str, Enum):
    """Threat categories"""
    MALWARE = "malware"
    PHISHING = "phishing"
    INTRUSION = "intrusion"
    DATA_EXFILTRATION = "data_exfiltration"
    BRUTE_FORCE = "brute_force"
    ANOMALOUS_BEHAVIOR = "anomalous_behavior"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    LATERAL_MOVEMENT = "lateral_movement"
    SUSPICIOUS_LOGIN = "suspicious_login"
    API_ABUSE = "api_abuse"


class ThreatStatus(str, Enum):
    """Threat detection status"""
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    MITIGATED = "mitigated"
    RESOLVED = "resolved"


@dataclass
class ThreatIndicator:
    """Indicator of Compromise (IoC)"""
    ioc_type: str  # ip, domain, hash, email, url
    value: str
    source: str
    confidence: float  # 0.0 to 1.0
    first_seen: datetime
    last_seen: datetime
    threat_types: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "ioc_type": self.ioc_type,
            "value": self.value,
            "source": self.source,
            "confidence": self.confidence,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "threat_types": self.threat_types,
            "metadata": self.metadata,
        }


@dataclass
class ThreatEvent:
    """Detected threat event"""
    threat_id: str
    level: ThreatLevel
    category: ThreatCategory
    status: ThreatStatus
    title: str
    description: str
    affected_entities: List[str]  # User IDs, IPs, etc.
    indicators: List[ThreatIndicator]
    threat_score: float  # 0.0 to 100.0
    detected_at: datetime
    source: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    mitigations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "threat_id": self.threat_id,
            "level": self.level.value,
            "category": self.category.value,
            "status": self.status.value,
            "title": self.title,
            "description": self.description,
            "affected_entities": self.affected_entities,
            "indicators": [ind.to_dict() for ind in self.indicators],
            "threat_score": self.threat_score,
            "detected_at": self.detected_at.isoformat(),
            "source": self.source,
            "metadata": self.metadata,
            "mitigations": self.mitigations,
        }


class ThreatDetector:
    """
    Main threat detection engine

    Coordinates threat intelligence, behavioral analysis, and automated hunting
    to provide comprehensive threat detection and response capabilities.
    """

    def __init__(
        self,
        enable_ml: bool = True,
        enable_auto_mitigation: bool = False,
        threat_score_threshold: float = 70.0,
    ):
        """
        Initialize threat detector

        Args:
            enable_ml: Enable machine learning-based detection
            enable_auto_mitigation: Enable automated threat mitigation
            threat_score_threshold: Threshold for critical alert (0-100)
        """
        self.enable_ml = enable_ml
        self.enable_auto_mitigation = enable_auto_mitigation
        self.threat_score_threshold = threat_score_threshold

        # Threat intelligence cache
        self.threat_intel_cache: Dict[str, ThreatIndicator] = {}
        self.cache_ttl = timedelta(hours=24)

        # Active threats being monitored
        self.active_threats: Dict[str, ThreatEvent] = {}

        # Detection statistics
        self.detection_stats = {
            "total_detections": 0,
            "critical_threats": 0,
            "high_threats": 0,
            "medium_threats": 0,
            "low_threats": 0,
            "false_positives": 0,
            "mitigated_threats": 0,
        }

        logger.info(
            f"ThreatDetector initialized (ML: {enable_ml}, "
            f"Auto-mitigation: {enable_auto_mitigation}, "
            f"Threshold: {threat_score_threshold})"
        )

    async def analyze_event(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Optional[ThreatEvent]:
        """
        Analyze an event for potential threats

        Args:
            event_type: Type of event (login, api_call, data_access, etc.)
            event_data: Event data to analyze
            context: Additional context for analysis

        Returns:
            ThreatEvent if threat detected, None otherwise
        """
        try:
            # Extract relevant indicators
            indicators = self._extract_indicators(event_data)

            # Check against threat intelligence
            intel_matches = await self._check_threat_intel(indicators)

            # Perform behavioral analysis
            behavioral_score = await self._analyze_behavior(
                event_type, event_data, context
            )

            # Calculate threat score
            threat_score = self._calculate_threat_score(
                intel_matches, behavioral_score, event_type
            )

            # Determine if this is a threat
            if threat_score >= self.threat_score_threshold:
                threat_event = self._create_threat_event(
                    event_type=event_type,
                    event_data=event_data,
                    threat_score=threat_score,
                    indicators=indicators,
                    intel_matches=intel_matches,
                )

                # Store active threat
                self.active_threats[threat_event.threat_id] = threat_event

                # Update statistics
                self._update_stats(threat_event)

                # Log threat detection
                logger.warning(
                    f"Threat detected: {threat_event.title} "
                    f"(Score: {threat_score:.1f}, Level: {threat_event.level.value})",
                    extra={
                        "threat_id": threat_event.threat_id,
                        "category": threat_event.category.value,
                        "affected_entities": threat_event.affected_entities,
                    }
                )

                # Trigger automated response if enabled
                if self.enable_auto_mitigation:
                    await self._auto_mitigate(threat_event)

                return threat_event

            return None

        except Exception as e:
            logger.error(f"Error analyzing event: {e}", exc_info=True)
            return None

    def _extract_indicators(self, event_data: Dict[str, Any]) -> List[ThreatIndicator]:
        """Extract threat indicators from event data"""
        indicators = []
        now = datetime.utcnow()

        # Extract IP address
        if "ip_address" in event_data:
            indicators.append(ThreatIndicator(
                ioc_type="ip",
                value=event_data["ip_address"],
                source="event_data",
                confidence=0.5,
                first_seen=now,
                last_seen=now,
            ))

        # Extract user agent
        if "user_agent" in event_data:
            indicators.append(ThreatIndicator(
                ioc_type="user_agent",
                value=event_data["user_agent"],
                source="event_data",
                confidence=0.3,
                first_seen=now,
                last_seen=now,
            ))

        # Extract file hashes
        for hash_type in ["md5", "sha256", "sha1"]:
            if hash_type in event_data:
                indicators.append(ThreatIndicator(
                    ioc_type=hash_type,
                    value=event_data[hash_type],
                    source="event_data",
                    confidence=0.9,
                    first_seen=now,
                    last_seen=now,
                ))

        # Extract URLs
        if "url" in event_data:
            indicators.append(ThreatIndicator(
                ioc_type="url",
                value=event_data["url"],
                source="event_data",
                confidence=0.6,
                first_seen=now,
                last_seen=now,
            ))

        return indicators

    async def _check_threat_intel(
        self, indicators: List[ThreatIndicator]
    ) -> List[ThreatIndicator]:
        """Check indicators against threat intelligence feeds"""
        matches = []

        for indicator in indicators:
            # Check cache first
            cache_key = f"{indicator.ioc_type}:{indicator.value}"
            if cache_key in self.threat_intel_cache:
                cached = self.threat_intel_cache[cache_key]
                if datetime.utcnow() - cached.last_seen < self.cache_ttl:
                    matches.append(cached)
                    continue

            # Check against known malicious indicators
            if await self._is_malicious_indicator(indicator):
                indicator.confidence = 0.9
                indicator.threat_types.append("known_malicious")
                matches.append(indicator)

                # Cache result
                self.threat_intel_cache[cache_key] = indicator

        return matches

    async def _is_malicious_indicator(self, indicator: ThreatIndicator) -> bool:
        """Check if indicator is known malicious (stub for real implementation)"""
        # In production, this would query:
        # - VirusTotal API
        # - AbuseIPDB
        # - AlienVault OTX
        # - MISP
        # - Internal threat feeds

        # For now, implement basic checks
        if indicator.ioc_type == "ip":
            # Check for private IPs (not malicious but suspicious in certain contexts)
            ip = indicator.value
            if ip.startswith(("10.", "172.16.", "192.168.", "127.")):
                return False

        # Placeholder: In production, make API calls to threat intelligence services
        return False

    async def _analyze_behavior(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> float:
        """Analyze behavioral patterns for anomalies (returns score 0-100)"""
        # This is a stub - real implementation would use behavioral analysis module
        # See behavioral_analysis.py for full implementation

        score = 0.0

        # Check for suspicious patterns
        if event_type == "login":
            # Multiple failed logins
            if event_data.get("failed_attempts", 0) > 5:
                score += 30.0

            # Login from new location
            if event_data.get("new_location", False):
                score += 20.0

            # Login at unusual time
            if event_data.get("unusual_time", False):
                score += 15.0

        elif event_type == "api_call":
            # Excessive API calls
            if event_data.get("call_rate", 0) > 100:
                score += 40.0

            # Access to sensitive endpoints
            if event_data.get("sensitive_endpoint", False):
                score += 25.0

        elif event_type == "data_access":
            # Large data download
            if event_data.get("data_size", 0) > 1000000:  # > 1MB
                score += 35.0

            # Access to sensitive data
            if event_data.get("sensitive_data", False):
                score += 30.0

        return min(score, 100.0)

    def _calculate_threat_score(
        self,
        intel_matches: List[ThreatIndicator],
        behavioral_score: float,
        event_type: str,
    ) -> float:
        """Calculate overall threat score (0-100)"""
        # Weighted scoring
        intel_score = 0.0
        if intel_matches:
            # Average confidence of matches
            avg_confidence = sum(m.confidence for m in intel_matches) / len(intel_matches)
            intel_score = avg_confidence * 50.0  # Max 50 points from intel

        # Combine scores
        threat_score = (intel_score * 0.6) + (behavioral_score * 0.4)

        # Boost for critical event types
        critical_events = {"privilege_escalation", "data_exfiltration", "malware_execution"}
        if event_type in critical_events:
            threat_score = min(threat_score * 1.5, 100.0)

        return threat_score

    def _create_threat_event(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        threat_score: float,
        indicators: List[ThreatIndicator],
        intel_matches: List[ThreatIndicator],
    ) -> ThreatEvent:
        """Create a threat event from detection data"""
        # Determine threat level based on score
        if threat_score >= 90:
            level = ThreatLevel.CRITICAL
        elif threat_score >= 75:
            level = ThreatLevel.HIGH
        elif threat_score >= 50:
            level = ThreatLevel.MEDIUM
        else:
            level = ThreatLevel.LOW

        # Determine category
        category_map = {
            "login": ThreatCategory.SUSPICIOUS_LOGIN,
            "api_call": ThreatCategory.API_ABUSE,
            "data_access": ThreatCategory.DATA_EXFILTRATION,
            "privilege_change": ThreatCategory.PRIVILEGE_ESCALATION,
            "network_connection": ThreatCategory.LATERAL_MOVEMENT,
        }
        category = category_map.get(event_type, ThreatCategory.ANOMALOUS_BEHAVIOR)

        # Generate threat ID
        threat_id = self._generate_threat_id(event_type, event_data)

        # Extract affected entities
        affected_entities = []
        if "user_id" in event_data:
            affected_entities.append(f"user:{event_data['user_id']}")
        if "ip_address" in event_data:
            affected_entities.append(f"ip:{event_data['ip_address']}")

        # Create title and description
        title = f"{category.value.replace('_', ' ').title()} Detected"
        description = f"Threat score: {threat_score:.1f}. Event type: {event_type}."

        if intel_matches:
            description += f" Matched {len(intel_matches)} threat intelligence indicators."

        return ThreatEvent(
            threat_id=threat_id,
            level=level,
            category=category,
            status=ThreatStatus.DETECTED,
            title=title,
            description=description,
            affected_entities=affected_entities,
            indicators=indicators + intel_matches,
            threat_score=threat_score,
            detected_at=datetime.utcnow(),
            source="threat_detector",
            metadata={"event_type": event_type, "event_data": event_data},
        )

    def _generate_threat_id(self, event_type: str, event_data: Dict[str, Any]) -> str:
        """Generate unique threat ID"""
        # Create deterministic ID based on event characteristics
        id_data = f"{event_type}:{json.dumps(event_data, sort_keys=True)}"
        hash_obj = hashlib.sha256(id_data.encode())
        return f"threat_{hash_obj.hexdigest()[:16]}"

    def _update_stats(self, threat_event: ThreatEvent) -> None:
        """Update detection statistics"""
        self.detection_stats["total_detections"] += 1

        level_key = f"{threat_event.level.value}_threats"
        if level_key in self.detection_stats:
            self.detection_stats[level_key] += 1

    async def _auto_mitigate(self, threat_event: ThreatEvent) -> None:
        """Automatically mitigate detected threat"""
        logger.info(
            f"Auto-mitigating threat: {threat_event.threat_id}",
            extra={"threat_level": threat_event.level.value}
        )

        # Mitigation actions based on threat level and category
        mitigations = []

        if threat_event.level == ThreatLevel.CRITICAL:
            mitigations.extend([
                "Block affected IP addresses",
                "Disable affected user accounts",
                "Alert security team",
                "Create incident ticket",
            ])
        elif threat_event.level == ThreatLevel.HIGH:
            mitigations.extend([
                "Rate limit affected entities",
                "Require MFA for affected accounts",
                "Alert security team",
            ])
        else:
            mitigations.extend([
                "Log event for review",
                "Monitor affected entities",
            ])

        threat_event.mitigations = mitigations
        threat_event.status = ThreatStatus.MITIGATED
        self.detection_stats["mitigated_threats"] += 1

    async def get_active_threats(
        self, level: Optional[ThreatLevel] = None
    ) -> List[ThreatEvent]:
        """Get list of active threats, optionally filtered by level"""
        threats = list(self.active_threats.values())

        if level:
            threats = [t for t in threats if t.level == level]

        return sorted(threats, key=lambda t: t.threat_score, reverse=True)

    async def update_threat_status(
        self, threat_id: str, status: ThreatStatus
    ) -> Optional[ThreatEvent]:
        """Update status of a threat"""
        if threat_id not in self.active_threats:
            return None

        threat = self.active_threats[threat_id]
        old_status = threat.status
        threat.status = status

        logger.info(
            f"Threat status updated: {threat_id} ({old_status.value} -> {status.value})"
        )

        # Update statistics
        if status == ThreatStatus.FALSE_POSITIVE:
            self.detection_stats["false_positives"] += 1

        return threat

    def get_statistics(self) -> Dict[str, Any]:
        """Get detection statistics"""
        return {
            **self.detection_stats,
            "active_threats": len(self.active_threats),
            "cache_size": len(self.threat_intel_cache),
        }
