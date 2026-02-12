"""
Behavioral Analysis - User behavior analytics and anomaly detection

Implements machine learning-based behavioral analysis to detect anomalous
user activities and potential insider threats.

Security Requirements:
- Real-time behavioral profiling
- Anomaly detection using statistical models
- User entity behavior analytics (UEBA)
- Baseline establishment and deviation detection
- Privacy-preserving analysis
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict, deque
from dataclasses import dataclass, field
import statistics
import math

logger = logging.getLogger(__name__)


@dataclass
class UserProfile:
    """User behavioral profile"""
    user_id: str
    created_at: datetime
    last_updated: datetime

    # Login patterns
    typical_login_hours: List[int] = field(default_factory=list)
    typical_login_locations: List[str] = field(default_factory=list)
    avg_session_duration: float = 0.0

    # API usage patterns
    avg_api_calls_per_hour: float = 0.0
    typical_endpoints: List[str] = field(default_factory=list)

    # Data access patterns
    avg_data_access_per_day: float = 0.0
    typical_resources: List[str] = field(default_factory=list)

    # Risk scoring
    baseline_risk_score: float = 0.0
    current_risk_score: float = 0.0

    # Activity history (for model training)
    activity_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "typical_login_hours": self.typical_login_hours,
            "typical_login_locations": self.typical_login_locations,
            "avg_session_duration": self.avg_session_duration,
            "avg_api_calls_per_hour": self.avg_api_calls_per_hour,
            "typical_endpoints": self.typical_endpoints,
            "avg_data_access_per_day": self.avg_data_access_per_day,
            "typical_resources": self.typical_resources,
            "baseline_risk_score": self.baseline_risk_score,
            "current_risk_score": self.current_risk_score,
            "activity_count": self.activity_count,
        }


@dataclass
class BehaviorEvent:
    """Individual behavior event"""
    user_id: str
    event_type: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AnomalyScore:
    """Anomaly detection result"""
    score: float  # 0.0 to 100.0
    is_anomalous: bool
    reasons: List[str] = field(default_factory=list)
    confidence: float = 0.0  # 0.0 to 1.0
    details: Dict[str, Any] = field(default_factory=dict)


class BehavioralAnalyzer:
    """
    Behavioral analysis engine

    Analyzes user behavior patterns and detects anomalies using:
    - Statistical analysis
    - Time-series analysis
    - Peer group comparison
    - Machine learning models (optional)
    """

    def __init__(
        self,
        anomaly_threshold: float = 3.0,  # Standard deviations
        window_size: int = 100,  # Events to keep in memory
        enable_ml: bool = False,
    ):
        """
        Initialize behavioral analyzer

        Args:
            anomaly_threshold: Number of std deviations for anomaly detection
            window_size: Number of recent events to keep per user
            enable_ml: Enable machine learning models
        """
        self.anomaly_threshold = anomaly_threshold
        self.window_size = window_size
        self.enable_ml = enable_ml

        # User profiles
        self.user_profiles: Dict[str, UserProfile] = {}

        # Recent activity windows (for real-time analysis)
        self.activity_windows: Dict[str, deque] = defaultdict(
            lambda: deque(maxlen=window_size)
        )

        # Peer groups (for comparison)
        self.peer_groups: Dict[str, List[str]] = defaultdict(list)

        # Statistics
        self.analysis_stats = {
            "total_analyses": 0,
            "anomalies_detected": 0,
            "profiles_created": 0,
            "profiles_updated": 0,
        }

        logger.info(
            f"BehavioralAnalyzer initialized "
            f"(threshold: {anomaly_threshold}, window: {window_size}, ML: {enable_ml})"
        )

    async def analyze_event(
        self,
        user_id: str,
        event_type: str,
        event_data: Dict[str, Any],
    ) -> AnomalyScore:
        """
        Analyze an event for behavioral anomalies

        Args:
            user_id: User identifier
            event_type: Type of event
            event_data: Event data

        Returns:
            AnomalyScore indicating if behavior is anomalous
        """
        self.analysis_stats["total_analyses"] += 1

        # Get or create user profile
        profile = await self._get_or_create_profile(user_id)

        # Create behavior event
        event = BehaviorEvent(
            user_id=user_id,
            event_type=event_type,
            timestamp=datetime.utcnow(),
            metadata=event_data,
        )

        # Add to activity window
        self.activity_windows[user_id].append(event)

        # Perform anomaly detection
        anomaly_score = await self._detect_anomaly(profile, event, event_data)

        # Update profile with new event
        await self._update_profile(profile, event, event_data)

        if anomaly_score.is_anomalous:
            self.analysis_stats["anomalies_detected"] += 1
            logger.warning(
                f"Behavioral anomaly detected for user {user_id}: "
                f"{', '.join(anomaly_score.reasons)}",
                extra={
                    "anomaly_score": anomaly_score.score,
                    "event_type": event_type,
                }
            )

        return anomaly_score

    async def _get_or_create_profile(self, user_id: str) -> UserProfile:
        """Get existing profile or create new one"""
        if user_id not in self.user_profiles:
            profile = UserProfile(
                user_id=user_id,
                created_at=datetime.utcnow(),
                last_updated=datetime.utcnow(),
            )
            self.user_profiles[user_id] = profile
            self.analysis_stats["profiles_created"] += 1
            logger.info(f"Created behavioral profile for user {user_id}")
        else:
            profile = self.user_profiles[user_id]

        return profile

    async def _detect_anomaly(
        self,
        profile: UserProfile,
        event: BehaviorEvent,
        event_data: Dict[str, Any],
    ) -> AnomalyScore:
        """Detect if event represents anomalous behavior"""
        anomaly_score = 0.0
        reasons = []
        details = {}

        # Insufficient baseline data
        if profile.activity_count < 10:
            return AnomalyScore(
                score=0.0,
                is_anomalous=False,
                reasons=["Insufficient baseline data"],
                confidence=0.0,
            )

        # Check login time anomaly
        if event.event_type == "login":
            time_score, time_reason = self._check_time_anomaly(profile, event)
            if time_score > 0:
                anomaly_score += time_score
                reasons.append(time_reason)
                details["time_anomaly"] = time_score

            # Check location anomaly
            location = event_data.get("location", "unknown")
            if location and location not in profile.typical_login_locations:
                location_score = 30.0
                anomaly_score += location_score
                reasons.append(f"Login from unusual location: {location}")
                details["location_anomaly"] = location_score

        # Check API usage anomaly
        elif event.event_type == "api_call":
            rate_score, rate_reason = self._check_rate_anomaly(profile, event)
            if rate_score > 0:
                anomaly_score += rate_score
                reasons.append(rate_reason)
                details["rate_anomaly"] = rate_score

            # Check endpoint anomaly
            endpoint = event_data.get("endpoint", "")
            if endpoint and endpoint not in profile.typical_endpoints:
                # Check if it's a sensitive endpoint
                if any(sensitive in endpoint for sensitive in ["admin", "config", "system"]):
                    endpoint_score = 40.0
                    anomaly_score += endpoint_score
                    reasons.append(f"Access to unusual sensitive endpoint: {endpoint}")
                    details["endpoint_anomaly"] = endpoint_score

        # Check data access anomaly
        elif event.event_type == "data_access":
            volume_score, volume_reason = self._check_volume_anomaly(profile, event, event_data)
            if volume_score > 0:
                anomaly_score += volume_score
                reasons.append(volume_reason)
                details["volume_anomaly"] = volume_score

        # Check session duration anomaly (for session events)
        if event.event_type in ["session_start", "session_end"]:
            duration = event_data.get("duration", 0)
            if duration > 0 and profile.avg_session_duration > 0:
                duration_score, duration_reason = self._check_duration_anomaly(
                    profile, duration
                )
                if duration_score > 0:
                    anomaly_score += duration_score
                    reasons.append(duration_reason)
                    details["duration_anomaly"] = duration_score

        # Peer group comparison
        if self.enable_ml:
            peer_score = await self._compare_to_peers(profile, event, event_data)
            if peer_score > 0:
                anomaly_score += peer_score
                reasons.append("Behavior differs significantly from peer group")
                details["peer_anomaly"] = peer_score

        # Calculate confidence based on amount of baseline data
        confidence = min(profile.activity_count / 100.0, 1.0)

        # Determine if anomalous
        is_anomalous = anomaly_score >= 50.0 and confidence >= 0.5

        return AnomalyScore(
            score=min(anomaly_score, 100.0),
            is_anomalous=is_anomalous,
            reasons=reasons,
            confidence=confidence,
            details=details,
        )

    def _check_time_anomaly(
        self, profile: UserProfile, event: BehaviorEvent
    ) -> Tuple[float, str]:
        """Check if event occurs at unusual time"""
        hour = event.timestamp.hour

        if not profile.typical_login_hours:
            return 0.0, ""

        # Check if hour is outside typical range
        if hour not in profile.typical_login_hours:
            # More anomalous if it's very late/early
            if hour in [0, 1, 2, 3, 4, 5]:
                return 35.0, f"Login at unusual hour: {hour:02d}:00"
            else:
                return 20.0, f"Login at atypical hour: {hour:02d}:00"

        return 0.0, ""

    def _check_rate_anomaly(
        self, profile: UserProfile, event: BehaviorEvent
    ) -> Tuple[float, str]:
        """Check if API call rate is anomalous"""
        # Count recent API calls in last hour
        now = event.timestamp
        one_hour_ago = now - timedelta(hours=1)

        recent_calls = [
            e for e in self.activity_windows[profile.user_id]
            if e.event_type == "api_call" and e.timestamp >= one_hour_ago
        ]

        current_rate = len(recent_calls)

        if profile.avg_api_calls_per_hour > 0:
            # Calculate z-score
            std_dev = profile.avg_api_calls_per_hour * 0.3  # Assume 30% std dev
            if std_dev > 0:
                z_score = (current_rate - profile.avg_api_calls_per_hour) / std_dev

                if z_score > self.anomaly_threshold:
                    score = min(z_score * 15, 50.0)
                    return score, f"API call rate {current_rate:.0f}/hr exceeds baseline {profile.avg_api_calls_per_hour:.0f}/hr"

        return 0.0, ""

    def _check_volume_anomaly(
        self, profile: UserProfile, event: BehaviorEvent, event_data: Dict[str, Any]
    ) -> Tuple[float, str]:
        """Check if data access volume is anomalous"""
        data_size = event_data.get("data_size", 0)

        if data_size == 0:
            return 0.0, ""

        # Count data accessed today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        today_accesses = [
            e for e in self.activity_windows[profile.user_id]
            if e.event_type == "data_access" and e.timestamp >= today_start
        ]

        total_today = sum(e.metadata.get("data_size", 0) for e in today_accesses)

        if profile.avg_data_access_per_day > 0:
            if total_today > profile.avg_data_access_per_day * 3:
                score = 45.0
                return score, f"Data access volume {total_today} bytes exceeds baseline by 3x"

        return 0.0, ""

    def _check_duration_anomaly(
        self, profile: UserProfile, duration: float
    ) -> Tuple[float, str]:
        """Check if session duration is anomalous"""
        if profile.avg_session_duration > 0:
            # Calculate z-score
            std_dev = profile.avg_session_duration * 0.4  # Assume 40% std dev
            if std_dev > 0:
                z_score = abs(duration - profile.avg_session_duration) / std_dev

                if z_score > self.anomaly_threshold:
                    score = min(z_score * 10, 30.0)
                    if duration > profile.avg_session_duration:
                        return score, f"Session duration {duration:.0f}s significantly longer than baseline {profile.avg_session_duration:.0f}s"
                    else:
                        return score, f"Session duration {duration:.0f}s significantly shorter than baseline {profile.avg_session_duration:.0f}s"

        return 0.0, ""

    async def _compare_to_peers(
        self, profile: UserProfile, event: BehaviorEvent, event_data: Dict[str, Any]
    ) -> float:
        """Compare behavior to peer group"""
        # This is a stub for ML-based peer comparison
        # In production, this would use clustering algorithms to:
        # 1. Identify peer groups based on role, department, behavior
        # 2. Compare current behavior to peer statistics
        # 3. Flag significant deviations

        # For now, return 0 (no anomaly)
        return 0.0

    async def _update_profile(
        self,
        profile: UserProfile,
        event: BehaviorEvent,
        event_data: Dict[str, Any],
    ) -> None:
        """Update user profile with new event data"""
        profile.last_updated = datetime.utcnow()
        profile.activity_count += 1
        self.analysis_stats["profiles_updated"] += 1

        # Update login patterns
        if event.event_type == "login":
            hour = event.timestamp.hour
            if hour not in profile.typical_login_hours:
                profile.typical_login_hours.append(hour)

            location = event_data.get("location")
            if location and location not in profile.typical_login_locations:
                profile.typical_login_locations.append(location)

            # Update average session duration
            duration = event_data.get("duration", 0)
            if duration > 0:
                if profile.avg_session_duration == 0:
                    profile.avg_session_duration = duration
                else:
                    # Exponential moving average
                    alpha = 0.1
                    profile.avg_session_duration = (
                        alpha * duration + (1 - alpha) * profile.avg_session_duration
                    )

        # Update API usage patterns
        elif event.event_type == "api_call":
            endpoint = event_data.get("endpoint", "")
            if endpoint and endpoint not in profile.typical_endpoints:
                profile.typical_endpoints.append(endpoint)
                # Limit to top 50 endpoints
                if len(profile.typical_endpoints) > 50:
                    profile.typical_endpoints.pop(0)

            # Update API call rate (hourly moving average)
            one_hour_ago = event.timestamp - timedelta(hours=1)
            recent_calls = [
                e for e in self.activity_windows[profile.user_id]
                if e.event_type == "api_call" and e.timestamp >= one_hour_ago
            ]
            current_rate = len(recent_calls)

            if profile.avg_api_calls_per_hour == 0:
                profile.avg_api_calls_per_hour = current_rate
            else:
                alpha = 0.1
                profile.avg_api_calls_per_hour = (
                    alpha * current_rate + (1 - alpha) * profile.avg_api_calls_per_hour
                )

        # Update data access patterns
        elif event.event_type == "data_access":
            resource = event_data.get("resource", "")
            if resource and resource not in profile.typical_resources:
                profile.typical_resources.append(resource)
                # Limit to top 50 resources
                if len(profile.typical_resources) > 50:
                    profile.typical_resources.pop(0)

            # Update average data access per day
            data_size = event_data.get("data_size", 0)
            if data_size > 0:
                if profile.avg_data_access_per_day == 0:
                    profile.avg_data_access_per_day = data_size
                else:
                    alpha = 0.05  # Slower adaptation for data volume
                    profile.avg_data_access_per_day = (
                        alpha * data_size + (1 - alpha) * profile.avg_data_access_per_day
                    )

    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user behavioral profile"""
        return self.user_profiles.get(user_id)

    async def get_risk_score(self, user_id: str) -> float:
        """Get current risk score for user"""
        profile = self.user_profiles.get(user_id)
        if not profile:
            return 0.0

        return profile.current_risk_score

    def get_statistics(self) -> Dict[str, Any]:
        """Get analysis statistics"""
        return {
            **self.analysis_stats,
            "total_profiles": len(self.user_profiles),
            "active_users": len(self.activity_windows),
        }
