"""Unit tests for NLP analyzer."""

import pytest
from app.services.nlp_analyzer import NLPAnalyzer


@pytest.fixture
def nlp_analyzer():
    """Create NLP analyzer instance."""
    return NLPAnalyzer()


@pytest.mark.asyncio
async def test_extract_unit_ids(nlp_analyzer):
    """Test unit ID extraction."""
    text = "Unit E-42 and M12 responding to scene. P-201 on standby."

    extraction = await nlp_analyzer.analyze_transcript(text)

    assert "E-42" in extraction.unit_ids
    assert "M-12" in extraction.unit_ids or "M12" in extraction.unit_ids
    assert "P-201" in extraction.unit_ids


@pytest.mark.asyncio
async def test_extract_locations(nlp_analyzer):
    """Test location extraction."""
    text = "Incident at 123 Main Street. Also check 5th and Oak intersection."

    extraction = await nlp_analyzer.analyze_transcript(text)

    assert any("Main Street" in loc for loc in extraction.locations)
    assert any("5th and Oak" in loc for loc in extraction.locations)


@pytest.mark.asyncio
async def test_extract_incident_codes(nlp_analyzer):
    """Test incident code extraction."""
    text = "We have a CODE 3 emergency. Requesting 10-50 backup."

    extraction = await nlp_analyzer.analyze_transcript(text)

    assert "CODE 3" in extraction.incident_codes or "CODE-3" in extraction.incident_codes
    assert "10-50" in extraction.incident_codes


@pytest.mark.asyncio
async def test_priority_detection_critical(nlp_analyzer):
    """Test critical priority detection."""
    test_cases = [
        "CODE 3 emergency at Main Street",
        "CPR in progress, patient unresponsive",
        "Structure fire with flames visible",
        "Shots fired, active shooter situation",
    ]

    for text in test_cases:
        extraction = await nlp_analyzer.analyze_transcript(text)
        assert extraction.priority == "CRITICAL", f"Failed for: {text}"


@pytest.mark.asyncio
async def test_priority_detection_high(nlp_analyzer):
    """Test high priority detection."""
    test_cases = [
        "Medical emergency, patient injured",
        "CODE 2 urgent response needed",
        "Domestic disturbance, possible assault",
    ]

    for text in test_cases:
        extraction = await nlp_analyzer.analyze_transcript(text)
        assert extraction.priority == "HIGH", f"Failed for: {text}"


@pytest.mark.asyncio
async def test_priority_detection_normal(nlp_analyzer):
    """Test normal priority detection."""
    test_cases = [
        "CODE 1 routine call",
        "Welfare check requested",
        "Non-emergency noise complaint",
    ]

    for text in test_cases:
        extraction = await nlp_analyzer.analyze_transcript(text)
        assert extraction.priority == "NORMAL", f"Failed for: {text}"


@pytest.mark.asyncio
async def test_intent_classification(nlp_analyzer):
    """Test intent classification."""
    test_cases = [
        ("Fire reported at 123 Main", "fire"),
        ("Medical emergency, ambulance needed", "medical_emergency"),
        ("Vehicle collision on Highway 50", "traffic"),
        ("Dispatch unit to scene", "dispatch_request"),
        ("Unit arrived on scene", "status_update"),
    ]

    for text, expected_intent in test_cases:
        extraction = await nlp_analyzer.analyze_transcript(text)
        assert extraction.intent == expected_intent, f"Failed for: {text}"


@pytest.mark.asyncio
async def test_empty_transcript(nlp_analyzer):
    """Test handling of empty transcript."""
    extraction = await nlp_analyzer.analyze_transcript("")

    assert extraction.unit_ids == []
    assert extraction.locations == []
    assert extraction.priority == "NORMAL"
    assert extraction.intent == "unknown"


@pytest.mark.asyncio
async def test_complex_transmission(nlp_analyzer):
    """Test complex real-world transmission."""
    text = """
    Dispatch, this is Engine 42. We have a CODE 3 structure fire at
    123 Main Street. Multiple units needed. Flames visible from second floor.
    Requesting Ladder 51 and Medic 12 on standby. Officer Johnson on scene
    coordinating traffic control.
    """

    extraction = await nlp_analyzer.analyze_transcript(text)

    # Check unit IDs
    assert len(extraction.unit_ids) >= 2

    # Check location
    assert any("Main Street" in loc for loc in extraction.locations)

    # Check incident code
    assert any("CODE" in code for code in extraction.incident_codes)

    # Check priority
    assert extraction.priority == "CRITICAL"

    # Check intent
    assert extraction.intent == "fire"

    # Check tags
    assert "fire" in extraction.tags
    assert "critical" in extraction.tags or "emergency" in extraction.tags

    # Check people
    assert any("Johnson" in person for person in extraction.people)
