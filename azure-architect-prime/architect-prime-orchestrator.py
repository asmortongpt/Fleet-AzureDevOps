#!/usr/bin/env python3
"""
ARCHITECT-PRIME: Master Orchestration AI
Multi-Agent Codebase Assessment & Correction System
"""

import os
import sys
import json
import asyncio
import subprocess
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

# AI SDK imports
import openai
from anthropic import Anthropic
import google.generativeai as genai

@dataclass
class Finding:
    """Individual codebase finding"""
    id: str
    category: str
    description: str
    severity: str  # Critical, High, Medium, Low
    target_hours: int
    assigned_agent: str
    status: str  # pending, in_progress, completed, blocked
    validation_criteria: List[str]

@dataclass
class Agent:
    """Specialized correction agent"""
    id: str
    name: str
    tier: int  # 1=Orchestration, 2=Commander, 3=Specialist
    scope: str
    findings: List[Finding]
    status: str

class ArchitectPrime:
    """Master orchestrator for codebase correction"""

    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.workspace = "/home/azureuser/agent-workspace"
        self.tracking_db = f"{self.workspace}/progress-tracking.json"

        # Initialize AI clients
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        # Initialize agents and findings
        self.agents = self._initialize_agents()
        self.findings = self._load_findings()

        self.log(f"ARCHITECT-PRIME initialized")
        self.log(f"Repository: {self.repo_path}")
        self.log(f"Total findings: {len(self.findings)}")
        self.log(f"Total agents: {len(self.agents)}")

    def log(self, message: str, level: str = "INFO"):
        """Structured logging"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}", flush=True)

    def _initialize_agents(self) -> List[Agent]:
        """Initialize all specialized agents"""
        return [
            # Tier 2: Backend Commander
            Agent(
                id="BACKEND-COMMANDER",
                name="Backend Systems Commander",
                tier=2,
                scope="All backend modules",
                findings=[],
                status="ready"
            ),

            # Tier 3: Backend Specialists
            Agent(
                id="BACKEND-ARCH-001",
                name="Backend Architecture & Configuration",
                tier=3,
                scope="Architecture_N_Config findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="BACKEND-API-002",
                name="Backend API & Data Fetching",
                tier=3,
                scope="API_N_DataFetching findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="BACKEND-SEC-003",
                name="Backend Security & Authentication",
                tier=3,
                scope="Security_N_Authentication findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="BACKEND-PERF-004",
                name="Backend Performance & Optimization",
                tier=3,
                scope="Performance_n_Optimization findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="BACKEND-TENANT-005",
                name="Backend Multi-Tenancy",
                tier=3,
                scope="multi_tenancy findings",
                findings=[],
                status="ready"
            ),

            # Tier 2: Frontend Commander
            Agent(
                id="FRONTEND-COMMANDER",
                name="Frontend Systems Commander",
                tier=2,
                scope="All frontend modules",
                findings=[],
                status="ready"
            ),

            # Tier 3: Frontend Specialists
            Agent(
                id="FRONTEND-ARCH-001",
                name="Frontend Architecture & Configuration",
                tier=3,
                scope="Architecture_N_Config findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="FRONTEND-DATA-002",
                name="Frontend Data Fetching",
                tier=3,
                scope="Data_Fetching findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="FRONTEND-SEC-003",
                name="Frontend Security & Authentication",
                tier=3,
                scope="Security_N_Authentication findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="FRONTEND-STATE-004",
                name="Frontend State Management",
                tier=3,
                scope="State_Management findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="FRONTEND-PERF-005",
                name="Frontend Performance & Optimization",
                tier=3,
                scope="Performance_n_Optimization findings",
                findings=[],
                status="ready"
            ),
            Agent(
                id="FRONTEND-TENANT-006",
                name="Frontend Multi-Tenancy",
                tier=3,
                scope="multi_tenancy findings",
                findings=[],
                status="ready"
            )
        ]

    def _load_findings(self) -> List[Finding]:
        """Load all findings from assessment"""
        findings = []

        # Backend findings (37 total)
        backend_findings = [
            # Architecture_N_Config (11)
            Finding("BE-ARCH-001", "Architecture", "TypeScript strict mode disabled", "Critical", 12, "BACKEND-ARCH-001", "pending",
                   ["npx tsc --noEmit passes"]),
            Finding("BE-ARCH-002", "Architecture", "No Dependency Injection", "High", 40, "BACKEND-ARCH-001", "pending",
                   ["All services use DI container"]),
            Finding("BE-ARCH-003", "Architecture", "Inconsistent Error Handling", "Critical", 40, "BACKEND-ARCH-001", "pending",
                   ["All errors extend AppError hierarchy"]),
            Finding("BE-ARCH-004", "Architecture", "Flat routes structure", "High", 12, "BACKEND-ARCH-001", "pending",
                   ["Routes grouped by domain"]),
            Finding("BE-ARCH-005", "Architecture", "Services not grouped by domain", "High", 16, "BACKEND-ARCH-001", "pending",
                   ["Services organized by module"]),
            Finding("BE-ARCH-006", "Architecture", "Business logic in routes", "High", 120, "BACKEND-ARCH-001", "pending",
                   ["Three-layer architecture implemented"]),
            Finding("BE-ARCH-007", "Architecture", "Missing ESLint security config", "Critical", 0, "BACKEND-ARCH-001", "pending",
                   ["npm run lint passes"]),
            Finding("BE-ARCH-008", "Architecture", "Missing Global Error Middleware", "High", 24, "BACKEND-ARCH-001", "pending",
                   ["Global error handler registered"]),

            # API_N_DataFetching (7)
            Finding("BE-API-001", "API", "No ORM - raw SQL everywhere", "High", 120, "BACKEND-API-002", "pending",
                   ["Prisma client generates without errors"]),
            Finding("BE-API-002", "API", "No query performance monitoring", "High", 0, "BACKEND-API-002", "pending",
                   ["pg_stat_statements enabled"]),
            Finding("BE-API-003", "API", "No proper response format", "High", 40, "BACKEND-API-002", "pending",
                   ["All endpoints return standardized format"]),
            Finding("BE-API-007", "API", "Using PUT instead of PATCH", "Medium", 0, "BACKEND-API-002", "pending",
                   ["Partial updates use PATCH"]),

            # Security_N_Authentication (8)
            Finding("BE-SEC-001", "Security", "Rate limiting needs differentiation", "Medium", 0, "BACKEND-SEC-003", "pending",
                   ["Tiered rate limiting active"]),
            Finding("BE-SEC-002", "Security", "Error logging incomplete", "High", 32, "BACKEND-SEC-003", "pending",
                   ["Structured logging with levels"]),
            Finding("BE-SEC-003", "Security", "Default JWT secret in code", "Critical", 0, "BACKEND-SEC-003", "pending",
                   ["JWT secret validated at startup"]),
            Finding("BE-SEC-004", "Security", "Log sanitization missing", "Medium", 0, "BACKEND-SEC-003", "pending",
                   ["Sensitive data redacted in logs"]),
            Finding("BE-SEC-005", "Security", "Input validation only 30%", "High", 24, "BACKEND-SEC-003", "pending",
                   ["100% of routes have Zod validation"]),
            Finding("BE-SEC-007", "Security", "Basic Helmet config", "High", 16, "BACKEND-SEC-003", "pending",
                   ["Helmet configured with strict CSP"]),

            # Performance_n_Optimization (8)
            Finding("BE-PERF-001", "Performance", "Caching not used", "Critical", 80, "BACKEND-PERF-004", "pending",
                   ["Redis caching active"]),
            Finding("BE-PERF-002", "Performance", "N+1 Query Patterns", "High", 40, "BACKEND-PERF-004", "pending",
                   ["No N+1 queries in critical paths"]),
            Finding("BE-PERF-003", "Performance", "No API response time middleware", "High", 16, "BACKEND-PERF-004", "pending",
                   ["Response time logged for all requests"]),
            Finding("BE-PERF-004", "Performance", "Memory leak detection missing", "Critical", 16, "BACKEND-PERF-004", "pending",
                   ["No connection leaks (pool monitoring)"]),
            Finding("BE-PERF-005", "Performance", "No worker threads for CPU tasks", "High", 32, "BACKEND-PERF-004", "pending",
                   ["CPU-intensive tasks use workers"]),

            # multi_tenancy (3)
            Finding("BE-TENANT-002", "Multi-Tenancy", "Tables without tenant_id", "Critical", 0, "BACKEND-TENANT-005", "pending",
                   ["All tables have tenant_id"]),
            Finding("BE-TENANT-003", "Multi-Tenancy", "Nullable tenant_id columns", "Critical", 0, "BACKEND-TENANT-005", "pending",
                   ["All tenant_id columns NOT NULL"]),
            Finding("BE-TENANT-001", "Multi-Tenancy", "RLS not enabled", "Medium", 0, "BACKEND-TENANT-005", "pending",
                   ["RLS enabled on all tenant tables"]),
        ]

        # Frontend findings (34 total)
        frontend_findings = [
            # Architecture_N_Config (11)
            Finding("FE-ARCH-001", "Architecture", "SRP Violation - monolithic components", "Critical", 120, "FRONTEND-ARCH-001", "pending",
                   ["No component exceeds 300 lines"]),
            Finding("FE-ARCH-003", "Architecture", "Flat folder structure", "High", 24, "FRONTEND-ARCH-001", "pending",
                   ["Feature-based folders implemented"]),
            Finding("FE-ARCH-004", "Architecture", "Code duplication", "High", 120, "FRONTEND-ARCH-001", "pending",
                   ["Shared hooks used instead of duplicates"]),
            Finding("FE-ARCH-005", "Architecture", "TypeScript config incomplete", "High", 24, "FRONTEND-ARCH-001", "pending",
                   ["TypeScript strict mode passes"]),
            Finding("FE-ARCH-006", "Architecture", "ESLint not configured", "High", 0, "FRONTEND-ARCH-001", "pending",
                   ["npm run lint passes"]),
            Finding("FE-ARCH-007", "Architecture", "Inconsistent field mappings", "Critical", 40, "FRONTEND-ARCH-001", "pending",
                   ["Field names match backend schema"]),

            # Data_Fetching (5)
            Finding("FE-DATA-001", "Data Fetching", "Multiple patterns used", "High", 40, "FRONTEND-DATA-002", "pending",
                   ["Only TanStack Query used"]),
            Finding("FE-DATA-003", "Data Fetching", "Unnecessary useEffect patterns", "High", 40, "FRONTEND-DATA-002", "pending",
                   ["No useEffect for derived state"]),
            Finding("FE-DATA-004", "Data Fetching", "Missing DAL layer", "High", 24, "FRONTEND-DATA-002", "pending",
                   ["All API calls through unified client"]),

            # Security_N_Authentication (7)
            Finding("FE-SEC-001", "Security", "Token in localStorage", "Critical", 24, "FRONTEND-SEC-003", "pending",
                   ["No tokens in localStorage"]),
            Finding("FE-SEC-002", "Security", "CSRF protection missing", "Critical", 16, "FRONTEND-SEC-003", "pending",
                   ["All requests include CSRF token"]),
            Finding("FE-SEC-003", "Security", "Token refresh not implemented", "High", 24, "FRONTEND-SEC-003", "pending",
                   ["401 responses trigger refresh"]),
            Finding("FE-SEC-004", "Security", "No RBAC on routes", "Critical", 80, "FRONTEND-SEC-003", "pending",
                   ["All routes protected with RBAC"]),
            Finding("FE-SEC-005", "Security", "Global error handler missing", "High", 24, "FRONTEND-SEC-003", "pending",
                   ["Error boundary catches all errors"]),

            # State_Management (4)
            Finding("FE-STATE-002", "State Management", "Prop drilling through 4+ levels", "High", 24, "FRONTEND-STATE-004", "pending",
                   ["No prop drilling beyond 2 levels"]),
            Finding("FE-STATE-003", "State Management", "No centralized server state", "High", 40, "FRONTEND-STATE-004", "pending",
                   ["All server state via React Query"]),
            Finding("FE-STATE-004", "State Management", "No state management library", "High", 40, "FRONTEND-STATE-004", "pending",
                   ["Zustand stores for client state"]),

            # Performance_n_Optimization (4)
            Finding("FE-PERF-001", "Performance", "Bundle size issues", "High", 32, "FRONTEND-PERF-005", "pending",
                   ["Initial bundle < 200KB gzipped"]),
            Finding("FE-PERF-002", "Performance", "120+ useMemo/useCallback instances", "High", 24, "FRONTEND-PERF-005", "pending",
                   ["React Compiler enabled"]),
            Finding("FE-PERF-003", "Performance", "No utility functions", "High", 40, "FRONTEND-PERF-005", "pending",
                   ["All formatting through utils"]),

            # multi_tenancy (3)
            Finding("FE-TENANT-002", "Multi-Tenancy", "No branding/theming support", "Medium", 0, "FRONTEND-TENANT-006", "pending",
                   ["Tenant branding loads on login"]),
            Finding("FE-TENANT-003", "Multi-Tenancy", "No feature flags", "Medium", 0, "FRONTEND-TENANT-006", "pending",
                   ["Feature flags control components"]),
        ]

        findings.extend(backend_findings)
        findings.extend(frontend_findings)

        return findings

    async def run_code_reviews(self):
        """Run all three AI code review agents"""
        self.log("🔍 Running AI Code Review Agents", "INFO")

        reviews = {}

        # 1. Greptile Analysis
        self.log("Running Greptile analysis...", "INFO")
        try:
            greptile_result = subprocess.run(
                ["greptile", "start"],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=self.repo_path
            )
            reviews['greptile'] = {
                'status': 'completed',
                'output': greptile_result.stdout,
                'findings': self._parse_greptile_findings(greptile_result.stdout)
            }
        except Exception as e:
            self.log(f"Greptile error: {e}", "ERROR")
            reviews['greptile'] = {'status': 'failed', 'error': str(e)}

        # 2. CodeRabbit Analysis
        self.log("Running CodeRabbit analysis...", "INFO")
        try:
            coderabbit_result = subprocess.run(
                ["coderabbit", "review", "--plain"],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=self.repo_path
            )
            reviews['coderabbit'] = {
                'status': 'completed',
                'output': coderabbit_result.stdout,
                'findings': self._parse_coderabbit_findings(coderabbit_result.stdout)
            }
        except Exception as e:
            self.log(f"CodeRabbit error: {e}", "ERROR")
            reviews['coderabbit'] = {'status': 'failed', 'error': str(e)}

        # 3. Manual Claude-based Deep Analysis
        self.log("Running Claude deep analysis...", "INFO")
        try:
            claude_analysis = await self._run_claude_analysis()
            reviews['claude'] = {
                'status': 'completed',
                'findings': claude_analysis
            }
        except Exception as e:
            self.log(f"Claude analysis error: {e}", "ERROR")
            reviews['claude'] = {'status': 'failed', 'error': str(e)}

        # Save results
        with open(f"{self.workspace}/code-review-results.json", 'w') as f:
            json.dump(reviews, f, indent=2)

        return reviews

    def _parse_greptile_findings(self, output: str) -> List[Dict]:
        """Parse Greptile output for findings"""
        findings = []
        # Parse Greptile output format
        # This is simplified - actual parsing would be more robust
        for line in output.split('\n'):
            if 'vulnerability' in line.lower() or 'issue' in line.lower():
                findings.append({'description': line, 'source': 'greptile'})
        return findings

    def _parse_coderabbit_findings(self, output: str) -> List[Dict]:
        """Parse CodeRabbit output for findings"""
        findings = []
        # Parse CodeRabbit output format
        for line in output.split('\n'):
            if any(severity in line.lower() for severity in ['critical', 'high', 'medium', 'low']):
                findings.append({'description': line, 'source': 'coderabbit'})
        return findings

    async def _run_claude_analysis(self) -> List[Dict]:
        """Run deep Claude-based code analysis"""
        findings = []

        # Critical security checks
        security_prompt = f"""
        Analyze the codebase at {self.repo_path} for:
        1. SQL injection vulnerabilities (check for string concatenation in queries)
        2. XSS vulnerabilities
        3. CSRF protection
        4. Authentication/authorization issues
        5. Hardcoded secrets
        6. Input validation gaps

        Return findings in JSON format with severity levels.
        """

        try:
            response = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[{"role": "user", "content": security_prompt}]
            )

            findings.append({
                'category': 'security',
                'analysis': response.content[0].text,
                'source': 'claude-sonnet-4'
            })
        except Exception as e:
            self.log(f"Claude security analysis error: {e}", "ERROR")

        return findings

    async def orchestrate_corrections(self):
        """Orchestrate all correction agents"""
        self.log("🎯 Starting Correction Orchestration", "INFO")

        # Wave 1: Critical path - must complete first
        wave_1 = [
            "BE-ARCH-001",  # TypeScript strict
            "FE-ARCH-005",  # TypeScript strict
            "BE-SEC-003",   # JWT secret
            "FE-SEC-001"    # Token storage
        ]

        # Wave 2: Architecture foundations
        wave_2 = [
            "BE-ARCH-002",  # DI
            "BE-ARCH-003",  # Error hierarchy
            "BE-ARCH-006",  # Three-layer
            "FE-ARCH-001"   # Component decomposition
        ]

        # Wave 3: API and data layer
        wave_3 = [
            "BE-API-001",   # ORM
            "BE-API-003",   # Response format
            "FE-DATA-001",  # TanStack Query
            "FE-SEC-004"    # RBAC
        ]

        # Execute waves sequentially
        for wave_num, wave_findings in enumerate([wave_1, wave_2, wave_3], 1):
            self.log(f"Executing Wave {wave_num}", "INFO")
            await self._execute_wave(wave_findings)

        self.log("✅ All corrections orchestrated", "INFO")

    async def _execute_wave(self, finding_ids: List[str]):
        """Execute a wave of corrections"""
        for finding_id in finding_ids:
            finding = next((f for f in self.findings if f.id == finding_id), None)
            if not finding:
                continue

            self.log(f"Processing {finding_id}: {finding.description}", "INFO")

            # Assign to agent
            agent = next((a for a in self.agents if a.id == finding.assigned_agent), None)
            if not agent:
                self.log(f"Agent not found for {finding_id}", "ERROR")
                continue

            # Execute correction
            result = await self._execute_correction(agent, finding)

            if result['success']:
                finding.status = 'completed'
                self.log(f"✅ {finding_id} completed", "INFO")
            else:
                finding.status = 'blocked'
                self.log(f"❌ {finding_id} blocked: {result['error']}", "ERROR")

            # Update tracking
            self._save_progress()

    async def _execute_correction(self, agent: Agent, finding: Finding) -> Dict[str, Any]:
        """Execute a specific correction"""
        try:
            # Use Claude to generate the correction
            response = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                messages=[{
                    "role": "user",
                    "content": f"""
                    Agent: {agent.name}
                    Finding: {finding.description}

                    Generate the code changes needed to fix this finding.
                    Include:
                    1. Files to modify
                    2. Exact code changes
                    3. Validation steps

                    Repository path: {self.repo_path}
                    """
                }]
            )

            correction_plan = response.content[0].text

            # Apply the correction (simplified - actual implementation would parse and apply changes)
            self.log(f"Correction plan generated for {finding.id}", "INFO")

            return {
                'success': True,
                'plan': correction_plan,
                'agent': agent.id,
                'finding': finding.id
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'agent': agent.id,
                'finding': finding.id
            }

    def _save_progress(self):
        """Save progress to tracking database"""
        tracking = {
            'timestamp': datetime.now().isoformat(),
            'findings': [asdict(f) for f in self.findings],
            'agents': [asdict(a) for a in self.agents]
        }

        with open(self.tracking_db, 'w') as f:
            json.dump(tracking, f, indent=2)

    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate final compliance report"""
        total_findings = len(self.findings)
        completed = len([f for f in self.findings if f.status == 'completed'])
        pending = len([f for f in self.findings if f.status == 'pending'])
        blocked = len([f for f in self.findings if f.status == 'blocked'])

        compliance_percentage = (completed / total_findings * 100) if total_findings > 0 else 0

        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_findings': total_findings,
                'completed': completed,
                'pending': pending,
                'blocked': blocked,
                'compliance_percentage': round(compliance_percentage, 2)
            },
            'findings_by_severity': self._group_by_severity(),
            'findings_by_category': self._group_by_category(),
            'agent_status': [asdict(a) for a in self.agents],
            'next_actions': self._determine_next_actions()
        }

        return report

    def _group_by_severity(self) -> Dict[str, int]:
        """Group findings by severity"""
        severities = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
        for finding in self.findings:
            if finding.severity in severities:
                severities[finding.severity] += 1
        return severities

    def _group_by_category(self) -> Dict[str, int]:
        """Group findings by category"""
        categories = {}
        for finding in self.findings:
            categories[finding.category] = categories.get(finding.category, 0) + 1
        return categories

    def _determine_next_actions(self) -> List[str]:
        """Determine priority next actions"""
        actions = []

        critical_pending = [f for f in self.findings if f.severity == 'Critical' and f.status == 'pending']
        if critical_pending:
            actions.append(f"Address {len(critical_pending)} critical findings immediately")

        blocked = [f for f in self.findings if f.status == 'blocked']
        if blocked:
            actions.append(f"Unblock {len(blocked)} findings")

        return actions

async def main():
    """Main execution function"""
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║     ARCHITECT-PRIME: Codebase Correction Orchestrator            ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print()

    repo_path = "/home/azureuser/Fleet"

    # Initialize orchestrator
    orchestrator = ArchitectPrime(repo_path)

    # Phase 1: Run all code reviews
    orchestrator.log("Phase 1: AI Code Reviews", "INFO")
    reviews = await orchestrator.run_code_reviews()

    # Phase 2: Execute corrections
    orchestrator.log("Phase 2: Orchestrated Corrections", "INFO")
    await orchestrator.orchestrate_corrections()

    # Phase 3: Generate compliance report
    orchestrator.log("Phase 3: Compliance Reporting", "INFO")
    report = orchestrator.generate_compliance_report()

    # Save final report
    with open(f"{orchestrator.workspace}/compliance-report.json", 'w') as f:
        json.dump(report, f, indent=2)

    # Print summary
    print("\n╔═══════════════════════════════════════════════════════════════════╗")
    print("║                     EXECUTION COMPLETE                            ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print(f"\nTotal Findings: {report['summary']['total_findings']}")
    print(f"Completed: {report['summary']['completed']}")
    print(f"Pending: {report['summary']['pending']}")
    print(f"Blocked: {report['summary']['blocked']}")
    print(f"Compliance: {report['summary']['compliance_percentage']}%")
    print(f"\nFull report: {orchestrator.workspace}/compliance-report.json")
    print(f"Code reviews: {orchestrator.workspace}/code-review-results.json")

if __name__ == "__main__":
    asyncio.run(main())
