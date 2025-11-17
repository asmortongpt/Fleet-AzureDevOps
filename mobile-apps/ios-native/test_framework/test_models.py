# test_models.py
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any
from datetime import datetime
import uuid


class TestStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class TestCommandResult:
    command: str
    category: str  # "unit", "integration", "ui", "api", "perf", "static", etc.
    status: TestStatus
    log: str


@dataclass
class TestTask:
    id: str
    description: str
    category: str  # "unit", "ui", "api", "data", "perf", "security", "architecture", "docs"
    status: TestStatus = TestStatus.PENDING
    depends_on: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestPlan:
    id: str
    feature_or_system: str
    tasks: List[TestTask] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class TestRunRecord:
    id: str
    test_plan_id: str
    tasks: List[TestTask]
    results: List[TestCommandResult]
    summary: str
    created_at: datetime = field(default_factory=datetime.utcnow)


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10].upper()}"
