"""
Anomaly Detection Service
ML-based anomaly detection for security monitoring

Detects:
- Unusual user behavior patterns
- Anomalous access patterns
- Statistical outliers in activity
- Time-series anomalies
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict
import numpy as np
from scipy import stats
import json

from security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SecuritySeverity,
    log_security_event
)

logger = logging.getLogger(__name__)


@dataclass
class UserProfile:
    """User behavior profile for anomaly detection"""
    user_id: str
    typical_hours: List[int]  # Hours of day user is typically active
    typical_endpoints: Dict[str, int]  # Endpoint access frequency
    typical_ip_count: int  # Number of unique IPs typically used
    avg_requests_per_hour: float
    avg_session_duration_minutes: float
    data_access_patterns: Dict[str, int]  # Resource access patterns
    last_updated: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "user_id": self.user_id,
            "typical_hours": self.typical_hours,
            "typical_endpoints": self.typical_endpoints,
            "typical_ip_count": self.typical_ip_count,
            "avg_requests_per_hour": self.avg_requests_per_hour,
            "avg_session_duration_minutes": self.avg_session_duration_minutes,
            "data_access_patterns": self.data_access_patterns,
            "last_updated": self.last_updated.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserProfile":
        """Create from dictionary"""
        return cls(
            user_id=data["user_id"],
            typical_hours=data["typical_hours"],
            typical_endpoints=data["typical_endpoints"],
            typical_ip_count=data["typical_ip_count"],
            avg_requests_per_hour=data["avg_requests_per_hour"],
            avg_session_duration_minutes=data["avg_session_duration_minutes"],
            data_access_patterns=data["data_access_patterns"],
            last_updated=datetime.fromisoformat(data["last_updated"])
        )


class AnomalyDetector:
    """ML-based anomaly detection service"""

    def __init__(
        self,
        learning_period_days: int = 14,
        anomaly_threshold: float = 3.0,  # Z-score threshold
        min_samples: int = 10
    ):
        """
        Initialize anomaly detector

        Args:
            learning_period_days: Days of data needed to build profile
            anomaly_threshold: Z-score threshold for anomaly detection
            min_samples: Minimum samples needed for statistical analysis
        """
        self.learning_period_days = learning_period_days
        self.anomaly_threshold = anomaly_threshold
        self.min_samples = min_samples

        # User profiles
        self.user_profiles: Dict[str, UserProfile] = {}

        # Historical data for pattern learning
        self.user_history: Dict[str, List[SecurityEvent]] = defaultdict(list)

    async def analyze_event(self, event: SecurityEvent) -> Tuple[bool, Optional[str]]:
        """
        Analyze an event for anomalies

        Args:
            event: Security event to analyze

        Returns:
            Tuple of (is_anomaly, reason)
        """
        if not event.user_id:
            return False, None

        # Add to history
        self.user_history[event.user_id].append(event)

        # Keep only recent history
        cutoff = datetime.utcnow() - timedelta(days=self.learning_period_days)
        self.user_history[event.user_id] = [
            e for e in self.user_history[event.user_id]
            if e.timestamp > cutoff
        ]

        # Get or create user profile
        profile = self.user_profiles.get(event.user_id)
        if not profile:
            # Build profile if we have enough data
            if len(self.user_history[event.user_id]) >= self.min_samples:
                profile = await self._build_user_profile(event.user_id)
                self.user_profiles[event.user_id] = profile
            else:
                # Not enough data yet
                return False, None

        # Check for anomalies
        anomalies = []

        # 1. Time-based anomaly
        if await self._is_time_anomaly(event, profile):
            anomalies.append("Unusual access time")

        # 2. Endpoint anomaly
        if await self._is_endpoint_anomaly(event, profile):
            anomalies.append("Unusual endpoint access")

        # 3. IP address anomaly
        if await self._is_ip_anomaly(event, profile):
            anomalies.append("Unusual IP address")

        # 4. Request rate anomaly
        if await self._is_rate_anomaly(event, profile):
            anomalies.append("Unusual request rate")

        # 5. Data access anomaly
        if await self._is_data_access_anomaly(event, profile):
            anomalies.append("Unusual data access pattern")

        if anomalies:
            reason = "; ".join(anomalies)

            # Log anomaly event
            anomaly_event = SecurityEvent(
                event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
                severity=SecuritySeverity.MEDIUM,
                timestamp=datetime.utcnow(),
                user_id=event.user_id,
                username=event.username,
                ip_address=event.ip_address,
                endpoint=event.endpoint,
                details={
                    "anomaly_reason": reason,
                    "original_event": event.to_dict(),
                    "user_profile": profile.to_dict()
                }
            )
            await log_security_event(anomaly_event)

            return True, reason

        return False, None

    async def _build_user_profile(self, user_id: str) -> UserProfile:
        """Build user behavior profile from historical data"""
        events = self.user_history[user_id]

        if not events:
            raise ValueError(f"No events for user {user_id}")

        # Analyze typical hours
        hours = [e.timestamp.hour for e in events]
        hour_counts = defaultdict(int)
        for hour in hours:
            hour_counts[hour] += 1

        # Hours where user has >10% of activity
        total = len(hours)
        typical_hours = [
            hour for hour, count in hour_counts.items()
            if count / total > 0.1
        ]

        # Analyze typical endpoints
        endpoint_counts = defaultdict(int)
        for e in events:
            if e.endpoint:
                endpoint_counts[e.endpoint] += 1

        # Analyze unique IPs
        unique_ips = {e.ip_address for e in events if e.ip_address}

        # Calculate average requests per hour
        time_span_hours = (
            events[-1].timestamp - events[0].timestamp
        ).total_seconds() / 3600
        avg_requests_per_hour = len(events) / max(time_span_hours, 1)

        # Calculate average session duration
        # Group events by session
        session_times: Dict[str, List[datetime]] = defaultdict(list)
        for e in events:
            if e.session_id:
                session_times[e.session_id].append(e.timestamp)

        session_durations = []
        for times in session_times.values():
            if len(times) > 1:
                duration = (max(times) - min(times)).total_seconds() / 60
                session_durations.append(duration)

        avg_session_duration = (
            np.mean(session_durations) if session_durations else 30.0
        )

        # Analyze data access patterns
        data_access = defaultdict(int)
        for e in events:
            if e.event_type == SecurityEventType.DATA_ACCESS and e.resource:
                data_access[e.resource] += 1

        return UserProfile(
            user_id=user_id,
            typical_hours=typical_hours,
            typical_endpoints=dict(endpoint_counts),
            typical_ip_count=len(unique_ips),
            avg_requests_per_hour=avg_requests_per_hour,
            avg_session_duration_minutes=avg_session_duration,
            data_access_patterns=dict(data_access),
            last_updated=datetime.utcnow()
        )

    async def _is_time_anomaly(
        self,
        event: SecurityEvent,
        profile: UserProfile
    ) -> bool:
        """Detect time-based anomalies"""
        current_hour = event.timestamp.hour

        # If user typically not active at this hour
        if current_hour not in profile.typical_hours:
            # More lenient for low-risk actions
            if event.event_type in [
                SecurityEventType.AUTH_SUCCESS,
                SecurityEventType.DATA_ACCESS
            ]:
                return False

            return True

        return False

    async def _is_endpoint_anomaly(
        self,
        event: SecurityEvent,
        profile: UserProfile
    ) -> bool:
        """Detect endpoint access anomalies"""
        if not event.endpoint:
            return False

        # Check if endpoint is in user's typical patterns
        if event.endpoint not in profile.typical_endpoints:
            # New endpoint access
            return True

        # Check if frequency is unusual
        typical_freq = profile.typical_endpoints[event.endpoint]
        recent_events = [
            e for e in self.user_history[event.user_id]
            if e.timestamp > datetime.utcnow() - timedelta(hours=1)
            and e.endpoint == event.endpoint
        ]

        # If accessing endpoint much more than typical
        if len(recent_events) > typical_freq * 3:
            return True

        return False

    async def _is_ip_anomaly(
        self,
        event: SecurityEvent,
        profile: UserProfile
    ) -> bool:
        """Detect IP address anomalies"""
        if not event.ip_address:
            return False

        # Get recent unique IPs
        recent_events = [
            e for e in self.user_history[event.user_id]
            if e.timestamp > datetime.utcnow() - timedelta(hours=24)
        ]

        recent_ips = {e.ip_address for e in recent_events if e.ip_address}

        # If using more IPs than typical
        if len(recent_ips) > profile.typical_ip_count * 2:
            return True

        # Check if new IP is from different geolocation
        # (requires geolocation data in event)
        if event.geolocation:
            # Get typical geolocations
            typical_locations = [
                e.geolocation for e in recent_events
                if e.geolocation and e.ip_address != event.ip_address
            ]

            if typical_locations:
                # Check if current location is far from typical
                # This is simplified - real implementation would use distance calculation
                current_country = event.geolocation.get("country")
                typical_countries = {
                    loc.get("country") for loc in typical_locations
                }

                if current_country not in typical_countries:
                    return True

        return False

    async def _is_rate_anomaly(
        self,
        event: SecurityEvent,
        profile: UserProfile
    ) -> bool:
        """Detect request rate anomalies"""
        # Count requests in last hour
        recent_events = [
            e for e in self.user_history[event.user_id]
            if e.timestamp > datetime.utcnow() - timedelta(hours=1)
        ]

        current_rate = len(recent_events)

        # Calculate Z-score
        if profile.avg_requests_per_hour > 0:
            # Use standard deviation estimate (assume ~20% variance)
            std_dev = profile.avg_requests_per_hour * 0.2
            z_score = (
                current_rate - profile.avg_requests_per_hour
            ) / std_dev

            if abs(z_score) > self.anomaly_threshold:
                return True

        return False

    async def _is_data_access_anomaly(
        self,
        event: SecurityEvent,
        profile: UserProfile
    ) -> bool:
        """Detect data access anomalies"""
        if event.event_type != SecurityEventType.DATA_ACCESS:
            return False

        if not event.resource:
            return False

        # Check if accessing new resource
        if event.resource not in profile.data_access_patterns:
            # New resource access
            return True

        # Check for unusual volume of data access
        recent_access = [
            e for e in self.user_history[event.user_id]
            if e.timestamp > datetime.utcnow() - timedelta(hours=1)
            and e.event_type == SecurityEventType.DATA_ACCESS
        ]

        # Calculate typical access count
        typical_access = sum(profile.data_access_patterns.values()) / max(
            len(profile.data_access_patterns), 1
        )

        # If accessing data much more than typical
        if len(recent_access) > typical_access * 3:
            return True

        return False

    async def detect_mass_data_exfiltration(
        self,
        user_id: str,
        time_window_hours: int = 1
    ) -> bool:
        """
        Detect potential mass data exfiltration

        Args:
            user_id: User to check
            time_window_hours: Time window to analyze

        Returns:
            True if potential exfiltration detected
        """
        recent_events = [
            e for e in self.user_history[user_id]
            if e.timestamp > datetime.utcnow() - timedelta(hours=time_window_hours)
            and e.event_type in [
                SecurityEventType.DATA_ACCESS,
                SecurityEventType.DATA_EXPORT
            ]
        ]

        if len(recent_events) < self.min_samples:
            return False

        # Check for suspicious patterns
        suspicious_indicators = 0

        # 1. High volume of data access
        if len(recent_events) > 50:
            suspicious_indicators += 1

        # 2. Accessing many different resources
        unique_resources = {e.resource for e in recent_events if e.resource}
        if len(unique_resources) > 20:
            suspicious_indicators += 1

        # 3. Sequential access pattern (scraping)
        timestamps = sorted([e.timestamp for e in recent_events])
        if len(timestamps) > 2:
            intervals = [
                (timestamps[i+1] - timestamps[i]).total_seconds()
                for i in range(len(timestamps) - 1)
            ]
            # Check if intervals are very regular (bot-like)
            if intervals:
                cv = np.std(intervals) / np.mean(intervals)  # Coefficient of variation
                if cv < 0.3:  # Very regular intervals
                    suspicious_indicators += 1

        # 4. Off-hours access
        off_hours_events = [
            e for e in recent_events
            if e.timestamp.hour < 6 or e.timestamp.hour > 22
        ]
        if len(off_hours_events) / len(recent_events) > 0.5:
            suspicious_indicators += 1

        # If 3 or more indicators, potential exfiltration
        if suspicious_indicators >= 3:
            # Log critical event
            exfil_event = SecurityEvent(
                event_type=SecurityEventType.DATA_EXPORT,
                severity=SecuritySeverity.CRITICAL,
                timestamp=datetime.utcnow(),
                user_id=user_id,
                details={
                    "suspicious_indicators": suspicious_indicators,
                    "event_count": len(recent_events),
                    "unique_resources": len(unique_resources),
                    "time_window_hours": time_window_hours,
                    "alert": "Potential mass data exfiltration detected"
                }
            )
            await log_security_event(exfil_event)
            return True

        return False

    async def update_profile(self, user_id: str):
        """Update user profile with latest data"""
        if len(self.user_history[user_id]) >= self.min_samples:
            profile = await self._build_user_profile(user_id)
            self.user_profiles[user_id] = profile
            logger.info(f"Updated profile for user {user_id}")

    async def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile"""
        return self.user_profiles.get(user_id)

    async def get_anomaly_score(
        self,
        user_id: str,
        time_window_hours: int = 24
    ) -> float:
        """
        Calculate anomaly score for a user

        Args:
            user_id: User to analyze
            time_window_hours: Time window to analyze

        Returns:
            Anomaly score (0.0 = normal, 1.0 = highly anomalous)
        """
        profile = self.user_profiles.get(user_id)
        if not profile:
            return 0.0

        recent_events = [
            e for e in self.user_history[user_id]
            if e.timestamp > datetime.utcnow() - timedelta(hours=time_window_hours)
        ]

        if not recent_events:
            return 0.0

        # Count anomalies
        anomaly_count = 0
        for event in recent_events:
            is_anomaly, _ = await self.analyze_event(event)
            if is_anomaly:
                anomaly_count += 1

        # Calculate score
        score = min(anomaly_count / len(recent_events), 1.0)
        return score

    def get_statistics(self) -> Dict[str, Any]:
        """Get anomaly detection statistics"""
        return {
            "total_profiles": len(self.user_profiles),
            "users_monitored": len(self.user_history),
            "learning_period_days": self.learning_period_days,
            "anomaly_threshold": self.anomaly_threshold,
            "min_samples": self.min_samples,
            "profiles": {
                user_id: profile.to_dict()
                for user_id, profile in self.user_profiles.items()
            }
        }


# Global detector instance
_detector: Optional[AnomalyDetector] = None


def get_anomaly_detector() -> AnomalyDetector:
    """Get or create the global anomaly detector instance"""
    global _detector
    if _detector is None:
        _detector = AnomalyDetector()
    return _detector
