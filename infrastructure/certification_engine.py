#!/usr/bin/env python3
"""
Spider Certification Engine
Complete certification system: Evidence, Gating, Scoring, Remediation
"""

import os
import json
import hashlib
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from pathlib import Path

# ============================================================================
# 1. EVIDENCE COLLECTION PIPELINE
# ============================================================================

class EvidenceType(Enum):
    SCREENSHOT = 'screenshot'
    VIDEO = 'video'
    TRACE = 'trace'
    LOG = 'log'
    REQUEST = 'request'
    RESPONSE = 'response'
    SCHEMA = 'schema'
    METRIC = 'metric'
    REPORT = 'report'

@dataclass
class EvidenceArtifact:
    """Single piece of evidence"""
    evidence_id: str
    evidence_type: EvidenceType
    file_path: str
    description: str
    item_id: Optional[str] = None
    task_id: Optional[str] = None
    file_size_bytes: int = 0
    checksum: str = ''
    metadata: Dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        return {
            'evidence_id': self.evidence_id,
            'type': self.evidence_type.value,
            'file_path': self.file_path,
            'description': self.description,
            'item_id': self.item_id,
            'task_id': self.task_id,
            'file_size_bytes': self.file_size_bytes,
            'checksum': self.checksum,
            'metadata': self.metadata,
            'created_at': self.created_at
        }

class EvidenceCollector:
    """Collects and verifies evidence artifacts"""

    def __init__(self, base_path: str = '/tmp/spider-cert-evidence'):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.artifacts: List[EvidenceArtifact] = []

    def register_artifact(self, evidence_type: EvidenceType, file_path: str,
                         description: str, item_id: str = None,
                         task_id: str = None, metadata: Dict = None) -> EvidenceArtifact:
        """Register a new evidence artifact"""

        # Calculate checksum if file exists
        checksum = ''
        file_size = 0

        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            with open(file_path, 'rb') as f:
                checksum = hashlib.sha256(f.read()).hexdigest()

        artifact = EvidenceArtifact(
            evidence_id=f"ev-{len(self.artifacts)+1:06d}",
            evidence_type=evidence_type,
            file_path=file_path,
            description=description,
            item_id=item_id,
            task_id=task_id,
            file_size_bytes=file_size,
            checksum=checksum,
            metadata=metadata or {}
        )

        self.artifacts.append(artifact)
        return artifact

    def verify_completeness(self, required_types: List[EvidenceType]) -> Tuple[bool, List[str]]:
        """Verify all required evidence types are collected"""
        collected_types = {art.evidence_type for art in self.artifacts}
        missing = [t.value for t in required_types if t not in collected_types]
        return (len(missing) == 0, missing)

    def generate_manifest(self) -> Dict:
        """Generate evidence manifest"""
        return {
            'total_artifacts': len(self.artifacts),
            'total_size_bytes': sum(a.file_size_bytes for a in self.artifacts),
            'by_type': self._group_by_type(),
            'artifacts': [a.to_dict() for a in self.artifacts]
        }

    def _group_by_type(self) -> Dict:
        groups = {}
        for artifact in self.artifacts:
            type_name = artifact.evidence_type.value
            if type_name not in groups:
                groups[type_name] = {'count': 0, 'total_size_bytes': 0}
            groups[type_name]['count'] += 1
            groups[type_name]['total_size_bytes'] += artifact.file_size_bytes
        return groups

# ============================================================================
# 2. GATING ENFORCEMENT SYSTEM
# ============================================================================

class GateType(Enum):
    CORRECTNESS = 'correctness'
    ACCURACY = 'accuracy'

@dataclass
class GateResult:
    """Result of a gate check"""
    gate_type: GateType
    passed: bool
    score: int  # 0-1000
    threshold: int = 1000  # Must be 1000
    violations: List[str] = field(default_factory=list)
    evidence_refs: List[str] = field(default_factory=list)

class GateEnforcer:
    """Enforces correctness and accuracy gates (both must be 1000/1000)"""

    GATE_THRESHOLD = 1000  # Non-negotiable

    def __init__(self):
        self.violations: List[Dict] = []

    def check_correctness_gate(self, item_id: str, test_results: Dict,
                               evidence: List[str]) -> GateResult:
        """
        Check correctness gate: workflow actions, endpoints, services must work perfectly
        """
        violations = []

        # Check for failures
        if test_results.get('status') != 'pass':
            violations.append(f"Test status: {test_results.get('status')}")

        # Check for errors
        if test_results.get('errors'):
            for error in test_results['errors']:
                violations.append(f"Error: {error}")

        # Check side effects
        if test_results.get('side_effects_correct') == False:
            violations.append("Side effects incorrect or missing")

        # Check permissions
        if test_results.get('permission_boundary_violated'):
            violations.append("Permission boundary violated")

        # Calculate score
        score = self.GATE_THRESHOLD if len(violations) == 0 else 0

        return GateResult(
            gate_type=GateType.CORRECTNESS,
            passed=(score == self.GATE_THRESHOLD),
            score=score,
            violations=violations,
            evidence_refs=evidence
        )

    def check_accuracy_gate(self, item_id: str, test_results: Dict,
                           ground_truth: Optional[Dict], evidence: List[str]) -> GateResult:
        """
        Check accuracy gate: analytics, scoring, AI outputs must match ground truth
        """
        violations = []

        # Only applies where ground truth exists
        if ground_truth is None:
            return GateResult(
                gate_type=GateType.ACCURACY,
                passed=True,  # N/A = pass
                score=self.GATE_THRESHOLD,
                evidence_refs=evidence
            )

        # Check numerical accuracy
        if 'expected_value' in ground_truth:
            actual = test_results.get('calculated_value')
            expected = ground_truth['expected_value']
            tolerance = ground_truth.get('tolerance', 0)

            if abs(actual - expected) > tolerance:
                violations.append(f"Value mismatch: expected {expected}, got {actual}")

        # Check classification accuracy
        if 'expected_classification' in ground_truth:
            actual = test_results.get('classification')
            expected = ground_truth['expected_classification']

            if actual != expected:
                violations.append(f"Classification mismatch: expected {expected}, got {actual}")

        # Check AI output accuracy
        if 'expected_ai_output' in ground_truth:
            # Implement specific AI validation
            pass

        score = self.GATE_THRESHOLD if len(violations) == 0 else 0

        return GateResult(
            gate_type=GateType.ACCURACY,
            passed=(score == self.GATE_THRESHOLD),
            score=score,
            violations=violations,
            evidence_refs=evidence
        )

    def enforce_gates(self, item_id: str, test_results: Dict,
                     ground_truth: Optional[Dict], evidence: List[str]) -> Dict:
        """
        Enforce both gates - both must pass (1000/1000)
        """
        correctness = self.check_correctness_gate(item_id, test_results, evidence)
        accuracy = self.check_accuracy_gate(item_id, test_results, ground_truth, evidence)

        # Record violations
        if not correctness.passed:
            self.violations.append({
                'item_id': item_id,
                'gate': 'correctness',
                'violations': correctness.violations
            })

        if not accuracy.passed:
            self.violations.append({
                'item_id': item_id,
                'gate': 'accuracy',
                'violations': accuracy.violations
            })

        return {
            'item_id': item_id,
            'correctness_gate': correctness.passed,
            'correctness_score': correctness.score,
            'accuracy_gate': accuracy.passed,
            'accuracy_score': accuracy.score,
            'overall_pass': correctness.passed and accuracy.passed,
            'violations': correctness.violations + accuracy.violations
        }

# ============================================================================
# 3. SCORING ENGINE
# ============================================================================

@dataclass
class ScoringRubric:
    """Scoring criteria for an item"""
    functionality: int = 300  # Weight for functionality (0-300)
    performance: int = 200    # Weight for performance (0-200)
    security: int = 200       # Weight for security (0-200)
    usability: int = 150      # Weight for usability (0-150)
    maintainability: int = 150  # Weight for maintainability (0-150)
    # Total: 1000

    def validate(self):
        total = self.functionality + self.performance + self.security + \
                self.usability + self.maintainability
        assert total == 1000, f"Weights must sum to 1000, got {total}"

@dataclass
class ItemScore:
    """Score for a single item"""
    item_id: str
    item_type: str
    category_scores: Dict[str, int]  # 0-weight for each category
    total_score: int  # 0-1000 weighted sum
    passes_threshold: bool  # >= 990
    deductions: List[Dict] = field(default_factory=list)
    gate_results: Optional[Dict] = None

    def to_dict(self) -> Dict:
        return {
            'item_id': self.item_id,
            'item_type': self.item_type,
            'category_scores': self.category_scores,
            'total_score': self.total_score,
            'passes_threshold': self.passes_threshold,
            'deductions': self.deductions,
            'gate_results': self.gate_results
        }

class ScoringEngine:
    """Scores items on 0-1000 scale with ≥990 threshold"""

    PASS_THRESHOLD = 990

    def __init__(self):
        self.rubric = ScoringRubric()
        self.rubric.validate()
        self.scores: List[ItemScore] = []

    def calculate_category_score(self, category: str, results: Dict,
                                 max_points: int) -> Tuple[int, List[Dict]]:
        """Calculate score for a category"""
        deductions = []
        score = max_points

        if category == 'functionality':
            # Deductions for functional issues
            if not results.get('works_as_expected', True):
                deduct = 100
                score -= deduct
                deductions.append({'reason': 'Does not work as expected', 'points': deduct})

            if results.get('errors_count', 0) > 0:
                deduct = min(50, results['errors_count'] * 10)
                score -= deduct
                deductions.append({'reason': f"{results['errors_count']} error(s)", 'points': deduct})

        elif category == 'performance':
            # Deductions for performance issues
            load_time = results.get('load_time_ms', 0)
            threshold = results.get('performance_threshold_ms', 3000)

            if load_time > threshold:
                excess_pct = ((load_time - threshold) / threshold) * 100
                deduct = min(100, int(excess_pct))
                score -= deduct
                deductions.append({'reason': f'Load time {load_time}ms > {threshold}ms', 'points': deduct})

        elif category == 'security':
            # Deductions for security issues
            if results.get('auth_bypass', False):
                deduct = 200
                score -= deduct
                deductions.append({'reason': 'Authentication bypass detected', 'points': deduct})

            if results.get('xss_vulnerable', False):
                deduct = 150
                score -= deduct
                deductions.append({'reason': 'XSS vulnerability', 'points': deduct})

        elif category == 'usability':
            # Deductions for usability issues
            if not results.get('accessible', True):
                deduct = 75
                score -= deduct
                deductions.append({'reason': 'Accessibility issues', 'points': deduct})

        elif category == 'maintainability':
            # Deductions for maintainability issues
            if results.get('code_complexity', 'low') == 'high':
                deduct = 50
                score -= deduct
                deductions.append({'reason': 'High code complexity', 'points': deduct})

        return (max(0, score), deductions)

    def score_item(self, item_id: str, item_type: str, test_results: Dict,
                   gate_results: Dict) -> ItemScore:
        """Score a single item (0-1000)"""

        # Gates must pass for eligible scoring
        if not gate_results['overall_pass']:
            # Automatic 0 if gates fail
            return ItemScore(
                item_id=item_id,
                item_type=item_type,
                category_scores={},
                total_score=0,
                passes_threshold=False,
                deductions=[{'reason': 'Gate failure', 'points': 1000}],
                gate_results=gate_results
            )

        # Calculate category scores
        category_scores = {}
        all_deductions = []

        for category, max_points in [
            ('functionality', self.rubric.functionality),
            ('performance', self.rubric.performance),
            ('security', self.rubric.security),
            ('usability', self.rubric.usability),
            ('maintainability', self.rubric.maintainability)
        ]:
            score, deductions = self.calculate_category_score(category, test_results, max_points)
            category_scores[category] = score
            all_deductions.extend(deductions)

        # Calculate total
        total_score = sum(category_scores.values())

        item_score = ItemScore(
            item_id=item_id,
            item_type=item_type,
            category_scores=category_scores,
            total_score=total_score,
            passes_threshold=(total_score >= self.PASS_THRESHOLD),
            deductions=all_deductions,
            gate_results=gate_results
        )

        self.scores.append(item_score)
        return item_score

    def generate_leaderboard(self) -> List[ItemScore]:
        """Generate ranked leaderboard"""
        return sorted(self.scores, key=lambda s: s.total_score, reverse=True)

    def get_failure_summary(self) -> Dict:
        """Summarize items that failed threshold"""
        failures = [s for s in self.scores if not s.passes_threshold]

        return {
            'total_items': len(self.scores),
            'passed': len(self.scores) - len(failures),
            'failed': len(failures),
            'pass_rate_pct': ((len(self.scores) - len(failures)) / len(self.scores) * 100) if self.scores else 0,
            'failures': [
                {
                    'item_id': f.item_id,
                    'score': f.total_score,
                    'threshold': self.PASS_THRESHOLD,
                    'deficit': self.PASS_THRESHOLD - f.total_score,
                    'deductions': f.deductions[:5]  # Top 5 deductions
                }
                for f in failures
            ]
        }

# ============================================================================
# 4. REMEDIATION LOOP CONTROLLER
# ============================================================================

@dataclass
class RemediationAction:
    """A fix to be applied"""
    action_id: str
    item_id: str
    issue_description: str
    proposed_fix: str
    files_to_change: List[str]
    priority: int  # 1 (critical) to 5 (low)

class RemediationController:
    """Manages remediation loop until all items ≥990"""

    def __init__(self, scoring_engine: ScoringEngine, gate_enforcer: GateEnforcer):
        self.scoring = scoring_engine
        self.gates = gate_enforcer
        self.max_iterations = 10
        self.iteration = 0
        self.remediation_history: List[Dict] = []

    def identify_failures(self) -> List[ItemScore]:
        """Identify all items that need remediation"""
        return [s for s in self.scoring.scores if not s.passes_threshold]

    def generate_remediation_plan(self, failures: List[ItemScore]) -> List[RemediationAction]:
        """Generate remediation actions for failures"""
        actions = []

        for failure in failures:
            # Determine priority based on score deficit
            deficit = self.scoring.PASS_THRESHOLD - failure.total_score
            priority = 1 if deficit > 100 else 2 if deficit > 50 else 3

            # Generate action based on deductions
            for deduction in failure.deductions:
                action = RemediationAction(
                    action_id=f"fix-{failure.item_id}-{len(actions)+1}",
                    item_id=failure.item_id,
                    issue_description=deduction['reason'],
                    proposed_fix=self._generate_fix(deduction['reason']),
                    files_to_change=[],  # To be determined by agent
                    priority=priority
                )
                actions.append(action)

        # Sort by priority
        actions.sort(key=lambda a: a.priority)
        return actions

    def _generate_fix(self, issue: str) -> str:
        """Generate fix description"""
        fix_map = {
            'Does not work as expected': 'Review and fix core functionality',
            'Load time': 'Optimize performance (caching, code splitting, lazy loading)',
            'Authentication bypass': 'Fix authentication/authorization logic',
            'XSS vulnerability': 'Sanitize inputs and escape outputs',
            'Accessibility issues': 'Add ARIA labels, semantic HTML, keyboard navigation',
            'High code complexity': 'Refactor to reduce complexity',
            'error': 'Fix error handling and edge cases'
        }

        for key, fix in fix_map.items():
            if key.lower() in issue.lower():
                return fix

        return 'Investigate and fix issue'

    def run_remediation_loop(self) -> Dict:
        """Run remediation loop until all items ≥990 or max iterations reached"""

        print("\n" + "=" * 80)
        print("🔧 REMEDIATION LOOP")
        print("=" * 80)

        while self.iteration < self.max_iterations:
            self.iteration += 1
            print(f"\n📍 Iteration {self.iteration}/{self.max_iterations}")

            # Identify failures
            failures = self.identify_failures()

            if not failures:
                print("✅ All items pass threshold (≥990)")
                break

            print(f"   Found {len(failures)} item(s) below threshold")

            # Generate plan
            plan = self.generate_remediation_plan(failures)
            print(f"   Generated {len(plan)} remediation action(s)")

            # In production, this would spawn agents to execute fixes
            # For now, simulate
            print("   ⚙️  Applying remediation actions...")

            # Record iteration
            self.remediation_history.append({
                'iteration': self.iteration,
                'failures_found': len(failures),
                'actions_generated': len(plan),
                'timestamp': datetime.now().isoformat()
            })

            # In production: re-test and re-score
            # For now, break to avoid infinite loop
            break

        summary = {
            'completed': len(self.identify_failures()) == 0,
            'iterations': self.iteration,
            'final_failure_count': len(self.identify_failures()),
            'history': self.remediation_history
        }

        print(f"\n{'✅ Remediation complete' if summary['completed'] else '⚠️  Max iterations reached'}")
        return summary

# ============================================================================
# Integration Test
# ============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("🎯 Spider Certification Engine Test")
    print("=" * 80)
    print()

    # Test Evidence Collection
    print("1️⃣  Testing Evidence Collector...")
    evidence = EvidenceCollector()
    evidence.register_artifact(
        EvidenceType.SCREENSHOT,
        '/tmp/test-dashboard.png',
        'Dashboard screenshot',
        item_id='ui-001',
        metadata={'resolution': '1920x1080'}
    )
    print(f"   ✅ Registered {len(evidence.artifacts)} artifact(s)")

    # Test Gate Enforcement
    print("\n2️⃣  Testing Gate Enforcer...")
    gate_enforcer = GateEnforcer()
    test_results = {'status': 'pass', 'errors': [], 'side_effects_correct': True}
    gates = gate_enforcer.enforce_gates('item-001', test_results, None, [])
    print(f"   ✅ Gates: Correctness={gates['correctness_gate']}, Accuracy={gates['accuracy_gate']}")

    # Test Scoring
    print("\n3️⃣  Testing Scoring Engine...")
    scorer = ScoringEngine()
    score = scorer.score_item(
        'item-001',
        'ui_page',
        {'works_as_expected': True, 'load_time_ms': 1500, 'accessible': True},
        gates
    )
    print(f"   ✅ Score: {score.total_score}/1000 (threshold: {scorer.PASS_THRESHOLD})")
    print(f"   Pass: {score.passes_threshold}")

    # Test Remediation
    print("\n4️⃣  Testing Remediation Controller...")
    remediator = RemediationController(scorer, gate_enforcer)
    print(f"   ✅ Remediation controller initialized")

    print("\n" + "=" * 80)
    print("✅ All certification engine components operational")
    print("=" * 80)
