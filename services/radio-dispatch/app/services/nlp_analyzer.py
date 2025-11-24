"""NLP-based entity extraction and intent classification."""

import re
from typing import Dict, List, Optional, Set
from dataclasses import dataclass

import spacy
from spacy.language import Language

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class EntityExtraction:
    """Extracted entities from radio transmission."""
    unit_ids: List[str]
    locations: List[str]
    incident_codes: List[str]
    people: List[str]
    organizations: List[str]
    times: List[str]
    priority: str
    intent: str
    tags: List[str]


class NLPAnalyzer:
    """Service for NLP analysis of radio transcripts."""

    # Common emergency/incident codes
    PRIORITY_KEYWORDS = {
        "CRITICAL": [
            r"\bcode\s*3\b",
            r"\bemergency\b",
            r"\b911\b",
            r"\bcpr\b",
            r"\bfire\b",
            r"\bshots?\s+fired\b",
            r"\bactive\s+shooter\b",
            r"\bstructure\s+fire\b",
            r"\bvehic(le|ular)\s+accident\b",
            r"\btrauma\b",
            r"\bunresponsive\b",
            r"\bchest\s+pain\b",
            r"\bstroke\b",
            r"\bbleeding\b",
        ],
        "HIGH": [
            r"\bcode\s*2\b",
            r"\burgent\b",
            r"\bmedical\b",
            r"\binjury\b",
            r"\bdomestic\b",
            r"\bassault\b",
            r"\btheft\b",
            r"\bburglary\b",
        ],
        "NORMAL": [
            r"\bcode\s*1\b",
            r"\broutine\b",
            r"\bnon[- ]emergency\b",
            r"\bwelfare\s+check\b",
            r"\bnoise\s+complaint\b",
        ]
    }

    # Incident type patterns
    INCIDENT_PATTERNS = {
        "medical_emergency": [r"\bmedical\b", r"\bems\b", r"\bambulance\b", r"\bcpr\b"],
        "fire": [r"\bfire\b", r"\bsmoke\b", r"\bstructure\b", r"\bflames\b"],
        "traffic": [r"\baccident\b", r"\bcrash\b", r"\bcollision\b", r"\btraffic\b", r"\bmva\b"],
        "law_enforcement": [r"\bpolice\b", r"\bsuspect\b", r"\barrest\b", r"\bcrime\b"],
        "dispatch_request": [r"\bdispatch\b", r"\bsend\b", r"\bneed\b", r"\brequesting\b"],
        "status_update": [r"\bon\s+scene\b", r"\barrived\b", r"\bclear\b", r"\bavailable\b"],
    }

    # Unit ID patterns (e.g., E42, M12, P-201)
    UNIT_PATTERN = re.compile(
        r"\b([EMPRC][-\s]?\d{1,3}|[A-Z]{2,3}\s*\d{1,4}|unit\s+\d+)\b",
        re.IGNORECASE
    )

    # Common incident codes
    CODE_PATTERN = re.compile(
        r"\b(code\s*[0-9]{1,2}|10-\d{1,3}|signal\s*\d{1,2})\b",
        re.IGNORECASE
    )

    def __init__(self):
        """Initialize NLP analyzer with spaCy model."""
        try:
            self.nlp: Language = spacy.load(settings.ENTITY_EXTRACTION_MODEL)
            logger.info("NLP model loaded", model=settings.ENTITY_EXTRACTION_MODEL)
        except Exception as e:
            logger.error("Failed to load NLP model", error=str(e))
            raise

    async def analyze_transcript(self, transcript: str) -> EntityExtraction:
        """
        Analyze radio transcript and extract entities.

        Args:
            transcript: Transcribed text from radio transmission

        Returns:
            EntityExtraction object with all identified entities
        """
        if not transcript or not transcript.strip():
            return self._empty_extraction()

        try:
            logger.info("Analyzing transcript", length=len(transcript))

            # Process with spaCy
            doc = self.nlp(transcript)

            # Extract entities
            unit_ids = self._extract_unit_ids(transcript)
            locations = self._extract_locations(doc, transcript)
            incident_codes = self._extract_incident_codes(transcript)
            people = self._extract_people(doc)
            organizations = self._extract_organizations(doc)
            times = self._extract_times(doc)

            # Determine priority
            priority = self._determine_priority(transcript)

            # Classify intent
            intent = self._classify_intent(transcript)

            # Generate tags
            tags = self._generate_tags(transcript, intent, priority)

            extraction = EntityExtraction(
                unit_ids=unit_ids,
                locations=locations,
                incident_codes=incident_codes,
                people=people,
                organizations=organizations,
                times=times,
                priority=priority,
                intent=intent,
                tags=tags
            )

            logger.info("Analysis complete",
                        unit_count=len(unit_ids),
                        location_count=len(locations),
                        priority=priority,
                        intent=intent)

            return extraction

        except Exception as e:
            logger.error("Analysis failed", error=str(e))
            return self._empty_extraction()

    def _extract_unit_ids(self, text: str) -> List[str]:
        """Extract unit identifiers (e.g., E42, M12, P-201)."""
        matches = self.UNIT_PATTERN.findall(text)
        # Normalize formatting
        units = [m.upper().replace(" ", "-") for m in matches]
        return sorted(set(units))

    def _extract_locations(self, doc, text: str) -> List[str]:
        """Extract location mentions."""
        locations: Set[str] = set()

        # spaCy GPE (Geopolitical Entity) and LOC entities
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC", "FAC"):
                locations.add(ent.text)

        # Address patterns (e.g., "123 Main Street", "5th and Oak")
        address_pattern = re.compile(
            r"\b\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b"
        )
        for match in address_pattern.finditer(text):
            locations.add(match.group(0))

        # Intersection pattern (e.g., "5th and Main")
        intersection_pattern = re.compile(
            r"\b([A-Z0-9][a-z]*)\s+and\s+([A-Z][a-z]+)\b"
        )
        for match in intersection_pattern.finditer(text):
            locations.add(match.group(0))

        return sorted(list(locations))

    def _extract_incident_codes(self, text: str) -> List[str]:
        """Extract incident codes (e.g., CODE 3, 10-50, SIGNAL 7)."""
        matches = self.CODE_PATTERN.findall(text)
        codes = [m.upper() for m in matches]
        return sorted(set(codes))

    def _extract_people(self, doc) -> List[str]:
        """Extract person names."""
        people = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
        return sorted(set(people))

    def _extract_organizations(self, doc) -> List[str]:
        """Extract organization names."""
        orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
        return sorted(set(orgs))

    def _extract_times(self, doc) -> List[str]:
        """Extract time references."""
        times = [ent.text for ent in doc.ents if ent.label_ in ("TIME", "DATE")]
        return sorted(set(times))

    def _determine_priority(self, text: str) -> str:
        """Determine priority level based on keywords."""
        text_lower = text.lower()

        # Check CRITICAL keywords first
        for pattern in self.PRIORITY_KEYWORDS["CRITICAL"]:
            if re.search(pattern, text_lower):
                return "CRITICAL"

        # Check HIGH keywords
        for pattern in self.PRIORITY_KEYWORDS["HIGH"]:
            if re.search(pattern, text_lower):
                return "HIGH"

        # Check NORMAL keywords
        for pattern in self.PRIORITY_KEYWORDS["NORMAL"]:
            if re.search(pattern, text_lower):
                return "NORMAL"

        # Default to NORMAL if no keywords matched
        return "NORMAL"

    def _classify_intent(self, text: str) -> str:
        """Classify the intent of the transmission."""
        text_lower = text.lower()

        # Score each intent type
        scores: Dict[str, int] = {}
        for intent_type, patterns in self.INCIDENT_PATTERNS.items():
            score = sum(1 for pattern in patterns if re.search(pattern, text_lower))
            if score > 0:
                scores[intent_type] = score

        # Return highest scoring intent
        if scores:
            return max(scores, key=scores.get)  # type: ignore

        return "unknown"

    def _generate_tags(self, text: str, intent: str, priority: str) -> List[str]:
        """Generate relevant tags for the transmission."""
        tags: Set[str] = set()

        # Add priority tag
        tags.add(priority.lower())

        # Add intent tag
        if intent != "unknown":
            tags.add(intent)

        # Add keyword-based tags
        text_lower = text.lower()
        tag_keywords = {
            "medical": ["medical", "ambulance", "ems", "paramedic"],
            "fire": ["fire", "smoke", "flames"],
            "police": ["police", "officer", "law enforcement"],
            "emergency": ["emergency", "urgent", "code 3"],
            "accident": ["accident", "crash", "collision"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in text_lower for kw in keywords):
                tags.add(tag)

        return sorted(list(tags))

    def _empty_extraction(self) -> EntityExtraction:
        """Return empty extraction result."""
        return EntityExtraction(
            unit_ids=[],
            locations=[],
            incident_codes=[],
            people=[],
            organizations=[],
            times=[],
            priority="NORMAL",
            intent="unknown",
            tags=[]
        )
