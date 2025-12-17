"""Machine learning-based anomaly detection for security threats.

This module provides:
- Behavioral baseline learning
- Statistical anomaly detection
- Pattern recognition for attack signatures
- Real-time threat scoring
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from collections import defaultdict, deque
import statistics
import math

from .security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SeverityLevel,
    EventProcessor,
)

logger = logging.getLogger(__name__)


@dataclass
class BehavioralBaseline:
    """Stores baseline behavioral metrics for a user/IP."""

    identifier: str
    user_id: Optional[str] = None
    source_ip: Optional[str] = None
    baseline_type: str = "user"  # "user" or "ip"

    # Authentication metrics
    auth_attempts_per_hour: float = 0.0
    auth_success_rate: float = 0.95
    failed_auth_streak: int = 0
    typical_auth_hours: List[int] = field(default_factory=list)

    # Data access metrics
    typical_resources: List[str] = field(default_factory=list)
    typical_data_volume: float = 0.0
    access_patterns: Dict[str, int] = field(default_factory=dict)

    # Privilege metrics
    typical_privilege_level: str = "user"
    privilege_escalation_attempts: int = 0

    # Session metrics
    typical_session_duration_minutes: float = 60.0
    concurrent_sessions: int = 1
    typical_locations: List[str] = field(default_factory=list)

    last_updated: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "identifier": self.identifier,
            "user_id": self.user_id,
            "source_ip": self.source_ip,
            "baseline_type": self.baseline_type,
            "auth_attempts_per_hour": self.auth_attempts_per_hour,
            "auth_success_rate": self.auth_success_rate,
            "failed_auth_streak": self.failed_auth_streak,
            "typical_auth_hours": self.typical_auth_hours,
            "typical_resources": self.typical_resources,
            "typical_data_volume": self.typical_data_volume,
            "access_patterns": self.access_patterns,
            "typical_privilege_level": self.typical_privilege_level,
            "privilege_escalation_attempts": self.privilege_escalation_attempts,
            "typical_session_duration_minutes": self.typical_session_duration_minutes,
            "concurrent_sessions": self.concurrent_sessions,
            "typical_locations": self.typical_locations,
            "last_updated": self.last_updated.isoformat(),
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class AnomalyScore:
    """Represents an anomaly score and rationale."""

    event_id: str
    score: float  # 0.0 to 1.0, where 1.0 is most anomalous
    threshold: float = 0.7
    factors: Dict[str, float] = field(default_factory=dict)
    reasoning: List[str] = field(default_factory=list)
    is_anomaly: bool = field(init=False)

    def __post_init__(self):
        """Calculate if this is an anomaly."""
        self.is_anomaly = self.score >= self.threshold

    def add_factor(self, name: str, score: float, reason: str) -> None:
        """Add a factor contributing to anomaly score.

        Args:
            name: Factor name
            score: Factor score (0.0 to 1.0)
            reason: Explanation for factor
        """
        self.factors[name] = score
        self.reasoning.append(reason)

        # Update overall score as weighted average
        self._recalculate_score()

    def _recalculate_score(self) -> None:
        """Recalculate overall anomaly score."""
        if not self.factors:
            self.score = 0.0
            return

        self.score = sum(self.factors.values()) / len(self.factors)
        self.is_anomaly = self.score >= self.threshold


class BehavioralAnalyzer:
    """Analyzes user and IP behavioral patterns."""

    def __init__(self, baseline_window_hours: int = 24):
        """Initialize behavioral analyzer.

        Args:
            baseline_window_hours: Hours of data to consider for baselines
        """
        self.baseline_window_hours = baseline_window_hours
        self.baselines: Dict[str, BehavioralBaseline] = {}
        self.event_history: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=1000)
        )

    def get_or_create_baseline(
        self,
        identifier: str,
        user_id: Optional[str] = None,
        source_ip: Optional[str] = None,
        baseline_type: str = "user",
    ) -> BehavioralBaseline:
        """Get or create a behavioral baseline.

        Args:
            identifier: Unique identifier for baseline
            user_id: Associated user ID
            source_ip: Associated source IP
            baseline_type: Type of baseline (user or ip)

        Returns:
            BehavioralBaseline instance
        """
        if identifier not in self.baselines:
            self.baselines[identifier] = BehavioralBaseline(
                identifier=identifier,
                user_id=user_id,
                source_ip=source_ip,
                baseline_type=baseline_type,
            )
        return self.baselines[identifier]

    def record_event(self, event: SecurityEvent) -> None:
        """Record an event for baseline learning.

        Args:
            event: Security event
        """
        # Record by user
        if event.user_id:
            self.event_history[f"user:{event.user_id}"].append(event)

        # Record by IP
        if event.source_ip:
            self.event_history[f"ip:{event.source_ip}"].append(event)

    def learn_baseline(self, identifier: str) -> BehavioralBaseline:
        """Learn baseline from recorded events.

        Args:
            identifier: Identifier to learn baseline for

        Returns:
            Updated BehavioralBaseline
        """
        baseline = self.get_or_create_baseline(identifier)
        events = list(self.event_history[identifier])

        if not events:
            return baseline

        # Learn authentication patterns
        auth_events = [
            e for e in events
            if e.event_type in (
                SecurityEventType.AUTH_SUCCESS,
                SecurityEventType.AUTH_FAILURE,
                SecurityEventType.AUTH_ATTEMPT,
            )
        ]
        if auth_events:
            baseline.auth_attempts_per_hour = len(auth_events) / self.baseline_window_hours
            success_count = sum(
                1 for e in auth_events
                if e.event_type == SecurityEventType.AUTH_SUCCESS
            )
            baseline.auth_success_rate = success_count / len(auth_events)
            baseline.typical_auth_hours = list(
                set(e.timestamp.hour for e in auth_events)
            )

        # Learn access patterns
        access_events = [
            e for e in events
            if e.event_type == SecurityEventType.DATA_ACCESS
        ]
        if access_events:
            baseline.typical_resources = list(
                set(e.resource for e in access_events if e.resource)
            )
            baseline.access_patterns = {
                resource: sum(
                    1 for e in access_events if e.resource == resource
                )
                for resource in baseline.typical_resources
            }

        baseline.last_updated = datetime.utcnow()
        return baseline

    def detect_anomalies(
        self,
        event: SecurityEvent,
        baseline: BehavioralBaseline
    ) -> AnomalyScore:
        """Detect anomalies in an event against baseline.

        Args:
            event: Event to check
            baseline: Behavioral baseline

        Returns:
            AnomalyScore with anomaly assessment
        """
        score = AnomalyScore(event_id=event.event_id)

        # Check authentication anomalies
        if event.event_type in (
            SecurityEventType.AUTH_SUCCESS,
            SecurityEventType.AUTH_FAILURE,
        ):
            self._check_auth_anomalies(event, baseline, score)

        # Check authorization anomalies
        if event.event_type == SecurityEventType.PRIVILEGE_ESCALATION:
            self._check_privilege_anomalies(event, baseline, score)

        # Check data access anomalies
        if event.event_type == SecurityEventType.DATA_ACCESS:
            self._check_access_anomalies(event, baseline, score)

        # Check timing anomalies
        self._check_timing_anomalies(event, baseline, score)

        # Check rate anomalies
        self._check_rate_anomalies(event, baseline, score)

        return score

    def _check_auth_anomalies(
        self,
        event: SecurityEvent,
        baseline: BehavioralBaseline,
        score: AnomalyScore
    ) -> None:
        """Check authentication-related anomalies."""
        if event.event_type == SecurityEventType.AUTH_FAILURE:
            # High failure rate is anomalous
            if baseline.auth_success_rate > 0.9:
                anomaly_score = 1.0 - baseline.auth_success_rate
                score.add_factor(
                    "auth_failure",
                    anomaly_score,
                    f"Auth failure when success rate is {baseline.auth_success_rate:.2%}"
                )

    def _check_privilege_anomalies(
        self,
        event: SecurityEvent,
        baseline: BehavioralBaseline,
        score: AnomalyScore
    ) -> None:
        """Check privilege escalation anomalies."""
        # Any escalation attempt for non-admin is anomalous
        if baseline.typical_privilege_level == "user":
            score.add_factor(
                "privilege_escalation",
                0.9,
                f"Privilege escalation attempt from {baseline.typical_privilege_level} level"
            )

    def _check_access_anomalies(
        self,
        event: SecurityEvent,
        baseline: BehavioralBaseline,
        score: AnomalyScore
    ) -> None:
        """Check data access anomalies."""
        if event.resource and event.resource not in baseline.typical_resources:
            if baseline.typical_resources:
                score.add_factor(
                    "unusual_resource",
                    0.7,
                    f"Access to unusual resource: {event.resource}"
                )

    def _check_timing_anomalies(
        self,
        event: SecurityEvent,
        baseline: BehavioralBaseline,
        score: AnomalyScore
    ) -> None:
        """Check timing-based anomalies."""
        current_hour = event.timestamp.hour
        if (
            baseline.typical_auth_hours
            and current_hour not in baseline.typical_auth_hours
        ):
            score.add_factor(
                "unusual_time",
                0.5,
                f"Access at unusual hour: {current_hour}:00"
            )

    def _check_rate_anomalies(
        self,
        event: SecurityEvent,
        baseline: BehavioralBaseline,
        score: AnomalyScore
    ) -> None:
        """Check rate-based anomalies."""
        if event.event_type == SecurityEventType.AUTH_ATTEMPT:
            # Track failed auth streak
            if event.result == "failed":
                baseline.failed_auth_streak += 1
            else:
                baseline.failed_auth_streak = 0

            # Many failures in a row is anomalous
            if baseline.failed_auth_streak >= 5:
                anomaly_score = min(
                    0.95,
                    baseline.failed_auth_streak / 10.0
                )
                score.add_factor(
                    "brute_force",
                    anomaly_score,
                    f"Brute force detected: {baseline.failed_auth_streak} failures"
                )


class AnomalyDetector(EventProcessor):
    """Detects anomalies in security events."""

    def __init__(self, analyzer: Optional[BehavioralAnalyzer] = None):
        """Initialize anomaly detector.

        Args:
            analyzer: BehavioralAnalyzer instance
        """
        self.analyzer = analyzer or BehavioralAnalyzer()
        self.anomalies: List[AnomalyScore] = []

    async def process(self, event: SecurityEvent) -> None:
        """Process event for anomalies.

        Args:
            event: Event to process
        """
        try:
            # Record event for baseline learning
            identifier = event.user_id or event.source_ip or "unknown"
            self.analyzer.record_event(event)

            # Get or create baseline
            baseline = self.analyzer.get_or_create_baseline(
                identifier=identifier,
                user_id=event.user_id,
                source_ip=event.source_ip,
            )

            # Detect anomalies
            anomaly_score = self.analyzer.detect_anomalies(event, baseline)
            self.anomalies.append(anomaly_score)

            if anomaly_score.is_anomaly:
                logger.warning(
                    f"Anomaly detected in event {event.event_id}",
                    extra={
                        "anomaly_score": anomaly_score.score,
                        "factors": anomaly_score.factors,
                        "reasoning": anomaly_score.reasoning,
                    }
                )

        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}", exc_info=True)

    def get_recent_anomalies(
        self,
        count: int = 100
    ) -> List[AnomalyScore]:
        """Get recent anomalies.

        Args:
            count: Number of recent anomalies

        Returns:
            List of recent anomalies
        """
        return self.anomalies[-count:] if self.anomalies else []

    def get_anomaly_rate(self, time_window: timedelta = timedelta(hours=1)) -> float:
        """Get anomaly rate in time window.

        Args:
            time_window: Time window to check

        Returns:
            Anomaly rate as percentage
        """
        if not self.anomalies:
            return 0.0

        recent_cutoff = datetime.utcnow() - time_window
        recent = [
            a for a in self.anomalies
        ]
        if not recent:
            return 0.0

        anomalies = sum(1 for a in recent if a.is_anomaly)
        return anomalies / len(recent)
