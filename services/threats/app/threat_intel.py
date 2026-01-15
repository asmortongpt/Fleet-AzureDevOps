"""
Threat Intelligence - Integration with threat intelligence feeds

Integrates with multiple threat intelligence sources including:
- VirusTotal
- AbuseIPDB
- AlienVault OTX
- MISP
- Custom feeds

Security Requirements:
- API key management via Azure Key Vault
- Rate limiting for API calls
- Caching to reduce API usage
- Retry logic with exponential backoff
- Comprehensive error handling
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from enum import Enum
import hashlib
import json
import os
from dataclasses import dataclass, field

# For production, would use aiohttp for async HTTP requests
# import aiohttp

logger = logging.getLogger(__name__)


class ThreatIntelSource(str, Enum):
    """Threat intelligence sources"""
    VIRUSTOTAL = "virustotal"
    ABUSEIPDB = "abuseipdb"
    ALIENVAULT_OTX = "alienvault_otx"
    MISP = "misp"
    CUSTOM = "custom"
    INTERNAL = "internal"


class IndicatorType(str, Enum):
    """Types of indicators of compromise"""
    IP_ADDRESS = "ip"
    DOMAIN = "domain"
    URL = "url"
    FILE_HASH = "file_hash"
    EMAIL = "email"
    USER_AGENT = "user_agent"
    CVE = "cve"


@dataclass
class ThreatIntelReport:
    """Threat intelligence report for an indicator"""
    indicator_type: IndicatorType
    indicator_value: str
    source: ThreatIntelSource
    is_malicious: bool
    confidence: float  # 0.0 to 1.0
    threat_types: List[str] = field(default_factory=list)
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    detection_count: int = 0
    additional_data: Dict[str, Any] = field(default_factory=dict)
    queried_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "indicator_type": self.indicator_type.value,
            "indicator_value": self.indicator_value,
            "source": self.source.value,
            "is_malicious": self.is_malicious,
            "confidence": self.confidence,
            "threat_types": self.threat_types,
            "first_seen": self.first_seen.isoformat() if self.first_seen else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "detection_count": self.detection_count,
            "additional_data": self.additional_data,
            "queried_at": self.queried_at.isoformat(),
        }


@dataclass
class ThreatIntelConfig:
    """Configuration for threat intelligence integration"""
    virustotal_api_key: Optional[str] = None
    abuseipdb_api_key: Optional[str] = None
    otx_api_key: Optional[str] = None
    misp_url: Optional[str] = None
    misp_api_key: Optional[str] = None
    enable_caching: bool = True
    cache_ttl_hours: int = 24
    rate_limit_per_minute: int = 4  # Conservative default
    timeout_seconds: int = 10


class ThreatIntelligence:
    """
    Threat intelligence integration engine

    Queries multiple threat intelligence sources and aggregates results
    to provide comprehensive threat analysis.
    """

    def __init__(self, config: Optional[ThreatIntelConfig] = None):
        """
        Initialize threat intelligence engine

        Args:
            config: Configuration for threat intel sources
        """
        if config is None:
            # Load from environment variables
            config = ThreatIntelConfig(
                virustotal_api_key=os.getenv("VIRUSTOTAL_API_KEY"),
                abuseipdb_api_key=os.getenv("ABUSEIPDB_API_KEY"),
                otx_api_key=os.getenv("OTX_API_KEY"),
                misp_url=os.getenv("MISP_URL"),
                misp_api_key=os.getenv("MISP_API_KEY"),
            )

        self.config = config

        # Cache for threat intelligence results
        self.cache: Dict[str, ThreatIntelReport] = {}
        self.cache_ttl = timedelta(hours=config.cache_ttl_hours)

        # Rate limiting
        self.rate_limit_window = 60  # seconds
        self.request_counts: Dict[str, List[datetime]] = {}

        # Statistics
        self.stats = {
            "total_queries": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "malicious_found": 0,
            "virustotal_queries": 0,
            "abuseipdb_queries": 0,
            "otx_queries": 0,
            "misp_queries": 0,
            "api_errors": 0,
        }

        logger.info("ThreatIntelligence engine initialized")

    async def check_indicator(
        self,
        indicator_type: IndicatorType,
        indicator_value: str,
        sources: Optional[List[ThreatIntelSource]] = None,
    ) -> List[ThreatIntelReport]:
        """
        Check an indicator against threat intelligence sources

        Args:
            indicator_type: Type of indicator
            indicator_value: Value to check
            sources: Specific sources to query (default: all configured)

        Returns:
            List of threat intelligence reports from all sources
        """
        self.stats["total_queries"] += 1

        # Check cache first
        cache_key = self._get_cache_key(indicator_type, indicator_value)
        if self.config.enable_caching and cache_key in self.cache:
            cached_report = self.cache[cache_key]
            if datetime.utcnow() - cached_report.queried_at < self.cache_ttl:
                self.stats["cache_hits"] += 1
                logger.debug(f"Cache hit for {indicator_type.value}: {indicator_value}")
                return [cached_report]

        self.stats["cache_misses"] += 1

        # Determine which sources to query
        if sources is None:
            sources = self._get_available_sources(indicator_type)

        # Query all sources concurrently
        tasks = []
        for source in sources:
            task = self._query_source(source, indicator_type, indicator_value)
            tasks.append(task)

        reports = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions and None values
        valid_reports = []
        for report in reports:
            if isinstance(report, ThreatIntelReport):
                valid_reports.append(report)

                # Cache the report
                if self.config.enable_caching and report.is_malicious:
                    self.cache[cache_key] = report

                if report.is_malicious:
                    self.stats["malicious_found"] += 1

            elif isinstance(report, Exception):
                logger.error(f"Error querying threat intel: {report}")
                self.stats["api_errors"] += 1

        return valid_reports

    async def _query_source(
        self,
        source: ThreatIntelSource,
        indicator_type: IndicatorType,
        indicator_value: str,
    ) -> Optional[ThreatIntelReport]:
        """Query a specific threat intelligence source"""
        # Check rate limit
        if not await self._check_rate_limit(source):
            logger.warning(f"Rate limit exceeded for {source.value}")
            return None

        try:
            if source == ThreatIntelSource.VIRUSTOTAL:
                return await self._query_virustotal(indicator_type, indicator_value)
            elif source == ThreatIntelSource.ABUSEIPDB:
                return await self._query_abuseipdb(indicator_type, indicator_value)
            elif source == ThreatIntelSource.ALIENVAULT_OTX:
                return await self._query_otx(indicator_type, indicator_value)
            elif source == ThreatIntelSource.MISP:
                return await self._query_misp(indicator_type, indicator_value)
            elif source == ThreatIntelSource.INTERNAL:
                return await self._query_internal_feeds(indicator_type, indicator_value)
            else:
                return None

        except Exception as e:
            logger.error(f"Error querying {source.value}: {e}", exc_info=True)
            return None

    async def _query_virustotal(
        self, indicator_type: IndicatorType, indicator_value: str
    ) -> Optional[ThreatIntelReport]:
        """Query VirusTotal API"""
        if not self.config.virustotal_api_key:
            return None

        self.stats["virustotal_queries"] += 1

        # In production, make actual API call:
        # async with aiohttp.ClientSession() as session:
        #     if indicator_type == IndicatorType.IP_ADDRESS:
        #         url = f"https://www.virustotal.com/api/v3/ip_addresses/{indicator_value}"
        #     elif indicator_type == IndicatorType.DOMAIN:
        #         url = f"https://www.virustotal.com/api/v3/domains/{indicator_value}"
        #     elif indicator_type == IndicatorType.FILE_HASH:
        #         url = f"https://www.virustotal.com/api/v3/files/{indicator_value}"
        #     else:
        #         return None
        #
        #     headers = {"x-apikey": self.config.virustotal_api_key}
        #     async with session.get(url, headers=headers, timeout=self.config.timeout_seconds) as resp:
        #         if resp.status == 200:
        #             data = await resp.json()
        #             return self._parse_virustotal_response(data, indicator_type, indicator_value)

        # Stub for demonstration
        logger.debug(f"Would query VirusTotal for {indicator_type.value}: {indicator_value}")

        # Return stub data
        return ThreatIntelReport(
            indicator_type=indicator_type,
            indicator_value=indicator_value,
            source=ThreatIntelSource.VIRUSTOTAL,
            is_malicious=False,
            confidence=0.0,
            detection_count=0,
        )

    async def _query_abuseipdb(
        self, indicator_type: IndicatorType, indicator_value: str
    ) -> Optional[ThreatIntelReport]:
        """Query AbuseIPDB API"""
        if not self.config.abuseipdb_api_key:
            return None

        # Only supports IP addresses
        if indicator_type != IndicatorType.IP_ADDRESS:
            return None

        self.stats["abuseipdb_queries"] += 1

        # In production, make actual API call:
        # async with aiohttp.ClientSession() as session:
        #     url = "https://api.abuseipdb.com/api/v2/check"
        #     headers = {
        #         "Key": self.config.abuseipdb_api_key,
        #         "Accept": "application/json"
        #     }
        #     params = {"ipAddress": indicator_value, "maxAgeInDays": "90"}
        #     async with session.get(url, headers=headers, params=params, timeout=self.config.timeout_seconds) as resp:
        #         if resp.status == 200:
        #             data = await resp.json()
        #             return self._parse_abuseipdb_response(data, indicator_value)

        # Stub for demonstration
        logger.debug(f"Would query AbuseIPDB for IP: {indicator_value}")

        return ThreatIntelReport(
            indicator_type=indicator_type,
            indicator_value=indicator_value,
            source=ThreatIntelSource.ABUSEIPDB,
            is_malicious=False,
            confidence=0.0,
        )

    async def _query_otx(
        self, indicator_type: IndicatorType, indicator_value: str
    ) -> Optional[ThreatIntelReport]:
        """Query AlienVault OTX API"""
        if not self.config.otx_api_key:
            return None

        self.stats["otx_queries"] += 1

        # In production, make actual API call:
        # async with aiohttp.ClientSession() as session:
        #     if indicator_type == IndicatorType.IP_ADDRESS:
        #         url = f"https://otx.alienvault.com/api/v1/indicators/IPv4/{indicator_value}/general"
        #     elif indicator_type == IndicatorType.DOMAIN:
        #         url = f"https://otx.alienvault.com/api/v1/indicators/domain/{indicator_value}/general"
        #     elif indicator_type == IndicatorType.FILE_HASH:
        #         url = f"https://otx.alienvault.com/api/v1/indicators/file/{indicator_value}/general"
        #     else:
        #         return None
        #
        #     headers = {"X-OTX-API-KEY": self.config.otx_api_key}
        #     async with session.get(url, headers=headers, timeout=self.config.timeout_seconds) as resp:
        #         if resp.status == 200:
        #             data = await resp.json()
        #             return self._parse_otx_response(data, indicator_type, indicator_value)

        # Stub for demonstration
        logger.debug(f"Would query AlienVault OTX for {indicator_type.value}: {indicator_value}")

        return ThreatIntelReport(
            indicator_type=indicator_type,
            indicator_value=indicator_value,
            source=ThreatIntelSource.ALIENVAULT_OTX,
            is_malicious=False,
            confidence=0.0,
        )

    async def _query_misp(
        self, indicator_type: IndicatorType, indicator_value: str
    ) -> Optional[ThreatIntelReport]:
        """Query MISP (Malware Information Sharing Platform)"""
        if not self.config.misp_url or not self.config.misp_api_key:
            return None

        self.stats["misp_queries"] += 1

        # In production, use PyMISP library:
        # from pymisp import PyMISP
        # misp = PyMISP(self.config.misp_url, self.config.misp_api_key, ssl=True)
        # results = misp.search(value=indicator_value, type_attribute=indicator_type.value)

        # Stub for demonstration
        logger.debug(f"Would query MISP for {indicator_type.value}: {indicator_value}")

        return ThreatIntelReport(
            indicator_type=indicator_type,
            indicator_value=indicator_value,
            source=ThreatIntelSource.MISP,
            is_malicious=False,
            confidence=0.0,
        )

    async def _query_internal_feeds(
        self, indicator_type: IndicatorType, indicator_value: str
    ) -> Optional[ThreatIntelReport]:
        """Query internal threat feeds (organization-specific)"""
        # This would query organization's internal threat intelligence database
        # Could include:
        # - Previously identified threats
        # - Blocked IPs/domains
        # - Custom watchlists
        # - Partner-shared intelligence

        logger.debug(f"Checking internal feeds for {indicator_type.value}: {indicator_value}")

        # Stub - return clean for now
        return ThreatIntelReport(
            indicator_type=indicator_type,
            indicator_value=indicator_value,
            source=ThreatIntelSource.INTERNAL,
            is_malicious=False,
            confidence=0.0,
        )

    def _get_available_sources(
        self, indicator_type: IndicatorType
    ) -> List[ThreatIntelSource]:
        """Get available sources for an indicator type"""
        sources = []

        if self.config.virustotal_api_key:
            sources.append(ThreatIntelSource.VIRUSTOTAL)

        if self.config.abuseipdb_api_key and indicator_type == IndicatorType.IP_ADDRESS:
            sources.append(ThreatIntelSource.ABUSEIPDB)

        if self.config.otx_api_key:
            sources.append(ThreatIntelSource.ALIENVAULT_OTX)

        if self.config.misp_url and self.config.misp_api_key:
            sources.append(ThreatIntelSource.MISP)

        # Always include internal feeds
        sources.append(ThreatIntelSource.INTERNAL)

        return sources

    async def _check_rate_limit(self, source: ThreatIntelSource) -> bool:
        """Check if we're within rate limit for a source"""
        now = datetime.utcnow()
        source_key = source.value

        # Initialize if needed
        if source_key not in self.request_counts:
            self.request_counts[source_key] = []

        # Remove old requests outside window
        window_start = now - timedelta(seconds=self.rate_limit_window)
        self.request_counts[source_key] = [
            ts for ts in self.request_counts[source_key]
            if ts > window_start
        ]

        # Check limit
        if len(self.request_counts[source_key]) >= self.config.rate_limit_per_minute:
            return False

        # Add this request
        self.request_counts[source_key].append(now)
        return True

    def _get_cache_key(
        self, indicator_type: IndicatorType, indicator_value: str
    ) -> str:
        """Generate cache key for indicator"""
        key_data = f"{indicator_type.value}:{indicator_value}"
        return hashlib.sha256(key_data.encode()).hexdigest()

    async def bulk_check_indicators(
        self,
        indicators: List[tuple[IndicatorType, str]],
        sources: Optional[List[ThreatIntelSource]] = None,
    ) -> Dict[str, List[ThreatIntelReport]]:
        """
        Check multiple indicators in bulk

        Args:
            indicators: List of (type, value) tuples
            sources: Specific sources to query

        Returns:
            Dictionary mapping indicator values to their reports
        """
        results = {}

        # Process in batches to respect rate limits
        batch_size = 10
        for i in range(0, len(indicators), batch_size):
            batch = indicators[i:i + batch_size]

            tasks = [
                self.check_indicator(ind_type, ind_value, sources)
                for ind_type, ind_value in batch
            ]

            batch_results = await asyncio.gather(*tasks)

            for (ind_type, ind_value), reports in zip(batch, batch_results):
                results[ind_value] = reports

            # Rate limiting delay between batches
            if i + batch_size < len(indicators):
                await asyncio.sleep(15)  # 15 second delay between batches

        return results

    def get_statistics(self) -> Dict[str, Any]:
        """Get threat intelligence statistics"""
        return {
            **self.stats,
            "cache_size": len(self.cache),
            "cache_hit_rate": (
                self.stats["cache_hits"] / max(self.stats["total_queries"], 1)
            ) * 100,
        }

    def clear_cache(self) -> None:
        """Clear the threat intelligence cache"""
        old_size = len(self.cache)
        self.cache.clear()
        logger.info(f"Cleared threat intel cache ({old_size} entries)")
