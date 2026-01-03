"""
MCP Server: Test Tools
Provides linting, type checking, unit tests, integration tests, coverage reports.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import subprocess
import os
import json
import pathlib
from datetime import datetime

app = FastAPI(title="MCP Test Tools", version="1.0.0")

# =============================================================================
# Models
# =============================================================================

class TestRequest(BaseModel):
    repo_path: str
    test_type: str  # lint, typecheck, unit, integration, e2e, coverage
    config: Optional[Dict[str, Any]] = {}

class CoverageThreshold(BaseModel):
    lines: float = 85.0
    branches: float = 80.0
    functions: float = 85.0
    statements: float = 85.0

# =============================================================================
# Health Check
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "mcp-test-tools",
        "timestamp": datetime.utcnow().isoformat()
    }

# =============================================================================
# Linting
# =============================================================================

@app.post("/lint/run")
async def run_lint(req: TestRequest):
    """Run linting on repository."""
    try:
        repo_path = pathlib.Path(req.repo_path)
        if not repo_path.exists():
            raise HTTPException(status_code=404, detail=f"Repository not found: {req.repo_path}")

        # Check if it's a TypeScript/JavaScript project
        if (repo_path / "package.json").exists():
            # Run ESLint
            result = subprocess.run(
                ["npm", "run", "lint", "--", "--format=json"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )

            try:
                lint_results = json.loads(result.stdout) if result.stdout else []
            except json.JSONDecodeError:
                lint_results = {"raw_output": result.stdout, "stderr": result.stderr}

            return {
                "success": result.returncode == 0,
                "results": lint_results,
                "total_errors": sum(r.get("errorCount", 0) for r in lint_results if isinstance(r, dict)),
                "total_warnings": sum(r.get("warningCount", 0) for r in lint_results if isinstance(r, dict))
            }

        # Check if it's a Python project
        elif (repo_path / "requirements.txt").exists() or (repo_path / "setup.py").exists():
            # Run ruff or flake8
            result = subprocess.run(
                ["ruff", "check", ".", "--output-format=json"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )

            try:
                lint_results = json.loads(result.stdout) if result.stdout else []
            except json.JSONDecodeError:
                # Fallback to flake8
                result = subprocess.run(
                    ["flake8", ".", "--format=json"],
                    cwd=repo_path,
                    capture_output=True,
                    text=True
                )
                lint_results = json.loads(result.stdout) if result.stdout else []

            return {
                "success": result.returncode == 0,
                "results": lint_results,
                "total_issues": len(lint_results)
            }

        else:
            raise HTTPException(status_code=400, detail="Unknown project type")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Type Checking
# =============================================================================

@app.post("/typecheck/run")
async def run_typecheck(req: TestRequest):
    """Run type checking on repository."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        # TypeScript
        if (repo_path / "tsconfig.json").exists():
            result = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )

            return {
                "success": result.returncode == 0,
                "errors": result.stdout,
                "type": "typescript"
            }

        # Python (mypy)
        elif (repo_path / "requirements.txt").exists():
            result = subprocess.run(
                ["mypy", ".", "--json-report=/tmp/mypy-report"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )

            return {
                "success": result.returncode == 0,
                "errors": result.stdout,
                "type": "python"
            }

        else:
            raise HTTPException(status_code=400, detail="No type checking configuration found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Unit Tests
# =============================================================================

@app.post("/test/unit")
async def run_unit_tests(req: TestRequest):
    """Run unit tests."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        # JavaScript/TypeScript (Jest/Vitest)
        if (repo_path / "package.json").exists():
            result = subprocess.run(
                ["npm", "test", "--", "--json", "--coverage"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            try:
                test_results = json.loads(result.stdout)
            except json.JSONDecodeError:
                test_results = {"raw_output": result.stdout}

            return {
                "success": result.returncode == 0,
                "results": test_results,
                "type": "jest/vitest"
            }

        # Python (pytest)
        else:
            result = subprocess.run(
                ["pytest", "tests/", "-v", "--json-report", "--json-report-file=/tmp/pytest-report.json"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            report_file = pathlib.Path("/tmp/pytest-report.json")
            test_results = {}
            if report_file.exists():
                with open(report_file, 'r') as f:
                    test_results = json.load(f)

            return {
                "success": result.returncode == 0,
                "results": test_results,
                "type": "pytest"
            }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Tests timed out after 5 minutes")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Integration Tests
# =============================================================================

@app.post("/test/integration")
async def run_integration_tests(req: TestRequest):
    """Run integration tests."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        # Run integration tests (assume separate test directory or tag)
        if (repo_path / "package.json").exists():
            result = subprocess.run(
                ["npm", "run", "test:integration", "--", "--json"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=600
            )
        else:
            result = subprocess.run(
                ["pytest", "tests/integration/", "-v", "--json-report", "--json-report-file=/tmp/integration-report.json"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=600
            )

        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "errors": result.stderr
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Integration tests timed out after 10 minutes")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Coverage
# =============================================================================

@app.post("/test/coverage")
async def run_coverage(req: TestRequest):
    """Run test coverage analysis."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        # JavaScript/TypeScript
        if (repo_path / "package.json").exists():
            result = subprocess.run(
                ["npm", "test", "--", "--coverage", "--json", "--outputFile=/tmp/coverage.json"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            coverage_file = repo_path / "coverage" / "coverage-summary.json"
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    coverage_data = json.load(f)

                total = coverage_data.get("total", {})
                return {
                    "success": True,
                    "coverage": {
                        "lines": total.get("lines", {}).get("pct", 0),
                        "branches": total.get("branches", {}).get("pct", 0),
                        "functions": total.get("functions", {}).get("pct", 0),
                        "statements": total.get("statements", {}).get("pct", 0)
                    },
                    "report_path": str(repo_path / "coverage" / "index.html")
                }

        # Python
        else:
            # Run coverage
            subprocess.run(
                ["coverage", "run", "-m", "pytest", "tests/"],
                cwd=repo_path,
                check=True
            )

            # Generate report
            result = subprocess.run(
                ["coverage", "json", "-o", "/tmp/coverage.json"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )

            with open("/tmp/coverage.json", 'r') as f:
                coverage_data = json.load(f)

            totals = coverage_data.get("totals", {})
            return {
                "success": True,
                "coverage": {
                    "lines": totals.get("percent_covered", 0),
                    "branches": totals.get("percent_covered_branches", 0),
                    "statements": totals.get("num_statements", 0)
                },
                "report_path": "/tmp/htmlcov/index.html"
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# JUnit Report Generation
# =============================================================================

@app.post("/report/junit")
async def generate_junit_report(req: TestRequest):
    """Generate JUnit XML report."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        if (repo_path / "package.json").exists():
            result = subprocess.run(
                ["npm", "test", "--", "--reporters=jest-junit"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )
        else:
            result = subprocess.run(
                ["pytest", "tests/", "--junitxml=/tmp/junit.xml"],
                cwd=repo_path,
                capture_output=True,
                text=True
            )

        junit_file = pathlib.Path("/tmp/junit.xml")
        if junit_file.exists():
            return {
                "success": True,
                "report_path": str(junit_file)
            }
        else:
            raise HTTPException(status_code=500, detail="JUnit report not generated")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# HTML Report Generation
# =============================================================================

@app.post("/report/html")
async def generate_html_report(req: TestRequest):
    """Generate HTML test report."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        if (repo_path / "package.json").exists():
            # Coverage report includes HTML
            subprocess.run(
                ["npm", "test", "--", "--coverage"],
                cwd=repo_path,
                check=True
            )
            report_path = repo_path / "coverage" / "index.html"
        else:
            subprocess.run(
                ["pytest", "tests/", "--html=/tmp/report.html", "--self-contained-html"],
                cwd=repo_path,
                check=True
            )
            report_path = pathlib.Path("/tmp/report.html")

        return {
            "success": report_path.exists(),
            "report_path": str(report_path)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
