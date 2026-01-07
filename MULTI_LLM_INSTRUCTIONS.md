# Multi-LLM Swarm Coordination Instructions

## Overview
This file coordinates work across multiple LLM agents working in parallel on different feature branches.

## Active Swarms

### Swarm 12: Testing & QA
**Branch:** `feature/swarm-12-testing-qa`
**Status:** IN PROGRESS
**Agent:** Claude-Code-Agent-4
**Started:** 2026-01-07 15:20:00 UTC

#### High Priority Tasks:
- [IN PROGRESS] Fix failing E2E tests
- [PENDING] Add unit tests for critical paths (target >80% coverage)
- [PENDING] Implement visual regression testing
- [PENDING] Create integration test suite for API endpoints
- [PENDING] Add performance benchmarks

#### Progress:
- ✅ Checked out branch feature/swarm-12-testing-qa
- ✅ Analyzed test infrastructure (Playwright E2E + Vitest unit tests)
- ✅ Identified existing test suites:
  - E2E: 24 test files in /e2e directory
  - Unit: Tests in /tests directory
  - Smoke: Production smoke tests passing
  - Visual: Visual regression tests configured
- 🔄 Running coverage analysis to identify gaps
- ⏳ Fixing failing tests
- ⏳ Adding missing test coverage

#### Test Coverage Status:
- Current: Analyzing...
- Target: >80% for critical paths
- E2E Tests: 210 tests running (smoke tests passing)
- Unit Tests: Running coverage analysis

#### Files Modified:
- MULTI_LLM_INSTRUCTIONS.md (created)

#### Next Steps:
1. Complete coverage analysis
2. Fix any failing unit tests
3. Add unit tests for critical paths with low coverage
4. Implement visual regression tests for key pages
5. Add integration tests for API endpoints
6. Add performance benchmarks
7. Commit and push changes

---

## Coordination Rules

1. **Branch Naming:** `feature/swarm-{number}-{description}`
2. **Status Updates:** Update this file when starting/completing tasks
3. **Merge Conflicts:** Pull from main before pushing
4. **Code Review:** Each swarm commits independently, PRs reviewed separately
5. **Communication:** Document all changes in this file

## Branch Status Legend
- ✅ COMPLETED
- 🔄 IN PROGRESS
- ⏳ PENDING
- ❌ BLOCKED

## Last Updated
2026-01-07 15:30:00 UTC by Claude-Code-Agent-4
