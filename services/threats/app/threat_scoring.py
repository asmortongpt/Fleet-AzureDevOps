"""
Threat Scoring - Advanced risk scoring and prioritization system

Implements sophisticated threat scoring algorithms to prioritize threats
based on multiple factors including severity, impact, likelihood, and context.

Security Requirements:
- Multi-factor risk assessment
- Dynamic score adjustment based on context
- Historical trend analysis
- Asset-based risk weighting
- Time-decay for older threats
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass, field
import math

logger = logging.getLogger(__name__)


class AssetCriticality(str, Enum):
    """Asset criticality levels"""
    CRITICAL = "critical"  # Mission-critical systems
    HIGH = "high"  # Important business systems
    MEDIUM = "medium"  # Standard systems
    LOW = "low"  # Development/test systems


class ThreatImpact(str, Enum):
    """Potential impact of threat"""
    CATASTROPHIC = "catastrophic"  # Complete system compromise
    SEVERE = "severe"  # Significant data loss or downtime
    MODERATE = "moderate"  # Limited impact
    MINOR = "minor"  # Minimal impact


class ThreatLikelihood(str, Enum):
    """Likelihood of threat realization"""
    CERTAIN = "certain"  # Active exploitation detected
    LIKELY = "likely"  # Indicators of active attempt
    POSSIBLE = "possible"  # Suspicious activity detected
    UNLIKELY = "unlikely"  # Low confidence detection


@dataclass
class AssetContext:
    """Context about affected asset"""
    asset_id: str
    asset_type: str  # server, workstation, network, data, user
    criticality: AssetCriticality
    data_classification: str  # public, internal, confidential, secret
    compliance_scope: List[str] = field(default_factory=list)  # PCI, HIPAA, FedRAMP, etc.
    business_units: List[str] = field(default_factory=list)


@dataclass
class ThreatContext:
    """Context for threat scoring"""
    affected_assets: List[AssetContext] = field(default_factory=list)
    affected_users: List[str] = field(default_factory=list)
    attack_vector: Optional[str] = None
    exploit_maturity: Optional[str] = None  # weaponized, proof-of-concept, theoretical
    threat_actor_sophistication: Optional[str] = None  # nation-state, criminal, amateur
    business_impact: Optional[str] = None


@dataclass
class ScoringFactors:
    """Individual scoring factors"""
    base_score: float = 0.0  # CVSS-like base score
    temporal_score: float = 0.0  # Time-based adjustments
    environmental_score: float = 0.0  # Organization-specific context
    behavioral_score: float = 0.0  # From behavioral analysis
    intelligence_score: float = 0.0  # From threat intel
    asset_score: float = 0.0  # Asset criticality weighting
    compliance_score: float = 0.0  # Compliance impact

    def total_score(self) -> float:
        """Calculate weighted total score"""
        # Weighted average of all factors
        weights = {
            "base": 0.25,
            "temporal": 0.10,
            "environmental": 0.15,
            "behavioral": 0.20,
            "intelligence": 0.15,
            "asset": 0.10,
            "compliance": 0.05,
        }

        total = (
            self.base_score * weights["base"] +
            self.temporal_score * weights["temporal"] +
            self.environmental_score * weights["environmental"] +
            self.behavioral_score * weights["behavioral"] +
            self.intelligence_score * weights["intelligence"] +
            self.asset_score * weights["asset"] +
            self.compliance_score * weights["compliance"]
        )

        return min(total, 100.0)


@dataclass
class RiskScore:
    """Comprehensive risk score result"""
    total_score: float  # 0.0 to 100.0
    priority_level: str  # P0, P1, P2, P3, P4
    severity: str  # Critical, High, Medium, Low
    factors: ScoringFactors
    recommendation: str
    sla_hours: int  # Response SLA in hours
    metadata: Dict[str, Any] = field(default_factory=dict)


class ThreatScorer:
    """
    Advanced threat scoring engine

    Calculates comprehensive risk scores using multiple factors and provides
    actionable prioritization recommendations.
    """

    def __init__(
        self,
        enable_asset_weighting: bool = True,
        enable_compliance_weighting: bool = True,
        time_decay_enabled: bool = True,
    ):
        """
        Initialize threat scorer

        Args:
            enable_asset_weighting: Weight scores by asset criticality
            enable_compliance_weighting: Increase scores for compliance-scoped assets
            time_decay_enabled: Apply time decay to older threats
        """
        self.enable_asset_weighting = enable_asset_weighting
        self.enable_compliance_weighting = enable_compliance_weighting
        self.time_decay_enabled = time_decay_enabled

        # Scoring statistics
        self.scoring_stats = {
            "total_scores": 0,
            "critical_scores": 0,
            "high_scores": 0,
            "medium_scores": 0,
            "low_scores": 0,
        }

        logger.info(
            f"ThreatScorer initialized "
            f"(asset_weighting: {enable_asset_weighting}, "
            f"compliance: {enable_compliance_weighting}, "
            f"time_decay: {time_decay_enabled})"
        )

    async def calculate_risk_score(
        self,
        threat_data: Dict[str, Any],
        context: Optional[ThreatContext] = None,
        detected_at: Optional[datetime] = None,
    ) -> RiskScore:
        """
        Calculate comprehensive risk score for a threat

        Args:
            threat_data: Raw threat detection data
            context: Additional context about threat
            detected_at: When threat was detected

        Returns:
            RiskScore with detailed scoring breakdown
        """
        self.scoring_stats["total_scores"] += 1

        if context is None:
            context = ThreatContext()

        if detected_at is None:
            detected_at = datetime.utcnow()

        # Calculate individual scoring factors
        factors = ScoringFactors()

        # 1. Base Score (intrinsic threat characteristics)
        factors.base_score = self._calculate_base_score(threat_data)

        # 2. Temporal Score (time-based factors)
        factors.temporal_score = self._calculate_temporal_score(
            threat_data, detected_at
        )

        # 3. Environmental Score (organization context)
        factors.environmental_score = self._calculate_environmental_score(
            threat_data, context
        )

        # 4. Behavioral Score (from behavioral analysis)
        factors.behavioral_score = threat_data.get("behavioral_score", 0.0)

        # 5. Intelligence Score (from threat intel)
        factors.intelligence_score = self._calculate_intelligence_score(threat_data)

        # 6. Asset Score (asset criticality)
        if self.enable_asset_weighting:
            factors.asset_score = self._calculate_asset_score(context)

        # 7. Compliance Score (regulatory impact)
        if self.enable_compliance_weighting:
            factors.compliance_score = self._calculate_compliance_score(context)

        # Calculate total score
        total_score = factors.total_score()

        # Determine priority and severity
        priority_level, severity = self._determine_priority_severity(total_score)

        # Generate recommendation
        recommendation = self._generate_recommendation(
            total_score, severity, factors, context
        )

        # Determine SLA
        sla_hours = self._calculate_sla(priority_level)

        # Update statistics
        severity_key = f"{severity.lower()}_scores"
        if severity_key in self.scoring_stats:
            self.scoring_stats[severity_key] += 1

        risk_score = RiskScore(
            total_score=total_score,
            priority_level=priority_level,
            severity=severity,
            factors=factors,
            recommendation=recommendation,
            sla_hours=sla_hours,
            metadata={
                "scored_at": datetime.utcnow().isoformat(),
                "asset_count": len(context.affected_assets),
                "user_count": len(context.affected_users),
            }
        )

        logger.info(
            f"Threat scored: {total_score:.1f} (Priority: {priority_level}, "
            f"Severity: {severity}, SLA: {sla_hours}h)",
            extra={"risk_score": risk_score}
        )

        return risk_score

    def _calculate_base_score(self, threat_data: Dict[str, Any]) -> float:
        """Calculate base threat score (CVSS-like)"""
        score = 0.0

        # Attack complexity
        complexity = threat_data.get("attack_complexity", "high")
        if complexity == "low":
            score += 30.0
        elif complexity == "medium":
            score += 20.0
        else:
            score += 10.0

        # Privileges required
        privileges = threat_data.get("privileges_required", "high")
        if privileges == "none":
            score += 25.0
        elif privileges == "low":
            score += 15.0
        else:
            score += 5.0

        # User interaction
        interaction = threat_data.get("user_interaction", "required")
        if interaction == "none":
            score += 20.0
        else:
            score += 10.0

        # Scope (does threat affect other components?)
        scope = threat_data.get("scope", "unchanged")
        if scope == "changed":
            score += 25.0
        else:
            score += 15.0

        return min(score, 100.0)

    def _calculate_temporal_score(
        self, threat_data: Dict[str, Any], detected_at: datetime
    ) -> float:
        """Calculate temporal score with time decay"""
        score = 50.0  # Base temporal score

        # Exploit code maturity
        exploit_maturity = threat_data.get("exploit_maturity", "unproven")
        if exploit_maturity == "weaponized":
            score += 30.0
        elif exploit_maturity == "proof-of-concept":
            score += 20.0
        elif exploit_maturity == "functional":
            score += 10.0

        # Remediation level
        remediation = threat_data.get("remediation_level", "official-fix")
        if remediation == "unavailable":
            score += 20.0
        elif remediation == "workaround":
            score += 10.0

        # Apply time decay if enabled
        if self.time_decay_enabled:
            age_hours = (datetime.utcnow() - detected_at).total_seconds() / 3600
            if age_hours > 24:
                # Decay score by 10% per day (max 50% reduction)
                decay_factor = max(0.5, 1.0 - (age_hours / 240))  # 240h = 10 days
                score *= decay_factor

        return min(score, 100.0)

    def _calculate_environmental_score(
        self, threat_data: Dict[str, Any], context: ThreatContext
    ) -> float:
        """Calculate environmental/organizational score"""
        score = 0.0

        # Threat actor sophistication
        actor_level = context.threat_actor_sophistication or "unknown"
        if actor_level == "nation-state":
            score += 40.0
        elif actor_level == "criminal":
            score += 30.0
        elif actor_level == "hacktivist":
            score += 20.0
        else:
            score += 10.0

        # Business impact
        impact = context.business_impact or "unknown"
        if impact == "catastrophic":
            score += 40.0
        elif impact == "severe":
            score += 30.0
        elif impact == "moderate":
            score += 20.0
        else:
            score += 10.0

        # Attack vector
        vector = context.attack_vector or "unknown"
        if vector == "network":
            score += 20.0
        elif vector == "adjacent":
            score += 15.0
        elif vector == "local":
            score += 10.0
        else:
            score += 5.0

        return min(score, 100.0)

    def _calculate_intelligence_score(self, threat_data: Dict[str, Any]) -> float:
        """Calculate score based on threat intelligence"""
        score = 0.0

        # Number of threat intel sources confirming threat
        intel_sources = threat_data.get("intel_sources", [])
        source_count = len(intel_sources)

        if source_count >= 3:
            score += 40.0
        elif source_count == 2:
            score += 30.0
        elif source_count == 1:
            score += 20.0

        # Confidence level from threat intel
        confidence = threat_data.get("intel_confidence", 0.0)
        score += confidence * 60.0  # Max 60 points from confidence

        return min(score, 100.0)

    def _calculate_asset_score(self, context: ThreatContext) -> float:
        """Calculate score based on affected asset criticality"""
        if not context.affected_assets:
            return 50.0  # Default score

        # Take highest criticality asset
        criticality_scores = {
            AssetCriticality.CRITICAL: 100.0,
            AssetCriticality.HIGH: 75.0,
            AssetCriticality.MEDIUM: 50.0,
            AssetCriticality.LOW: 25.0,
        }

        max_criticality = max(
            (asset.criticality for asset in context.affected_assets),
            key=lambda c: criticality_scores.get(c, 0.0)
        )

        base_score = criticality_scores.get(max_criticality, 50.0)

        # Boost if multiple critical assets affected
        critical_count = sum(
            1 for asset in context.affected_assets
            if asset.criticality == AssetCriticality.CRITICAL
        )

        if critical_count > 1:
            base_score = min(base_score * 1.2, 100.0)

        return base_score

    def _calculate_compliance_score(self, context: ThreatContext) -> float:
        """Calculate score based on compliance impact"""
        if not context.affected_assets:
            return 0.0

        # Check if any asset is in compliance scope
        compliance_frameworks = set()
        for asset in context.affected_assets:
            compliance_frameworks.update(asset.compliance_scope)

        if not compliance_frameworks:
            return 0.0

        # Score based on number and criticality of frameworks
        high_impact_frameworks = {"FedRAMP", "HIPAA", "PCI-DSS", "SOC2"}

        high_impact_count = len(compliance_frameworks.intersection(high_impact_frameworks))

        if high_impact_count >= 2:
            return 90.0
        elif high_impact_count == 1:
            return 70.0
        elif compliance_frameworks:
            return 50.0

        return 0.0

    def _determine_priority_severity(
        self, total_score: float
    ) -> tuple[str, str]:
        """Determine priority level and severity from score"""
        if total_score >= 90:
            return "P0", "Critical"
        elif total_score >= 75:
            return "P1", "High"
        elif total_score >= 50:
            return "P2", "Medium"
        elif total_score >= 25:
            return "P3", "Low"
        else:
            return "P4", "Info"

    def _generate_recommendation(
        self,
        total_score: float,
        severity: str,
        factors: ScoringFactors,
        context: ThreatContext,
    ) -> str:
        """Generate actionable recommendation"""
        recommendations = []

        if severity == "Critical":
            recommendations.append("IMMEDIATE ACTION REQUIRED")
            recommendations.append("Escalate to security leadership")
            recommendations.append("Activate incident response team")

            if context.affected_assets:
                recommendations.append("Consider isolating affected assets")

        elif severity == "High":
            recommendations.append("Urgent investigation required")
            recommendations.append("Notify security team")

            if factors.intelligence_score > 70:
                recommendations.append("Threat confirmed by multiple intelligence sources")

        elif severity == "Medium":
            recommendations.append("Investigate within SLA timeframe")
            recommendations.append("Review and document findings")

        elif severity == "Low":
            recommendations.append("Monitor for escalation")
            recommendations.append("Review during regular security assessment")

        else:
            recommendations.append("Log for historical analysis")

        # Add specific recommendations based on factors
        if factors.behavioral_score > 70:
            recommendations.append("Unusual behavior detected - review user activity")

        if factors.compliance_score > 70:
            recommendations.append("Compliance impact - notify compliance team")

        return " | ".join(recommendations)

    def _calculate_sla(self, priority_level: str) -> int:
        """Calculate response SLA in hours"""
        sla_map = {
            "P0": 1,  # 1 hour
            "P1": 4,  # 4 hours
            "P2": 24,  # 1 day
            "P3": 72,  # 3 days
            "P4": 168,  # 1 week
        }
        return sla_map.get(priority_level, 24)

    def get_statistics(self) -> Dict[str, Any]:
        """Get scoring statistics"""
        return self.scoring_stats.copy()
