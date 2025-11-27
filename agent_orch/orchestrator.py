#!/usr/bin/env python3
"""
Multi-Agent Orchestrator - Main control loop.
Coordinates Codex, Jules, DevOps, and Verifier agents to autonomously
fix and deploy the Fleet React app to Azure.
"""

import os
import sys
import yaml
import json
import logging
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from dotenv import load_dotenv
from colorama import init, Fore, Style
from tabulate import tabulate

# Import agents
from agents.codex_agent import CodexAgent
from agents.jules_agent import JulesAgent
from agents.devops_agent import DevOpsAgent
from agents.verifier_agent import VerifierAgent

# Initialize colorama for colored terminal output
init(autoreset=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent_orch/logs/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class MultiAgentOrchestrator:
    """Main orchestration system that coordinates all agents."""

    def __init__(self, config_path: str, environment: str = "staging"):
        """
        Initialize the orchestrator.

        Args:
            config_path: Path to config.yaml
            environment: Deployment environment (staging/prod)
        """
        self.config_path = Path(config_path)
        self.environment = environment
        self.iteration = 0
        self.previous_diagnosis = None

        # Load configuration
        with open(self.config_path, 'r') as f:
            self.config = yaml.safe_load(f)

        # Validate environment
        if environment not in self.config['environments']:
            raise ValueError(f"Environment '{environment}' not found in config")

        self.env_config = self.config['environments'][environment]

        # Project root
        self.project_root = Path(__file__).parent.parent.absolute()

        # Initialize agents
        self._init_agents()

        # Create logs directory
        (self.project_root / "agent_orch" / "logs").mkdir(parents=True, exist_ok=True)

        logger.info(f"Initialized MultiAgentOrchestrator for environment: {environment}")

    def _init_agents(self):
        """Initialize all agents with proper credentials."""
        # Load environment variables
        load_dotenv(Path.home() / ".env")

        # Validate required secrets
        missing_secrets = []
        for secret in self.config['secrets_required']:
            if not os.getenv(secret):
                missing_secrets.append(secret)

        if missing_secrets:
            raise ValueError(f"Missing required secrets: {', '.join(missing_secrets)}")

        # Get deployment token from environment
        token_secret = self.env_config['deployment_token_secret']
        deployment_token = os.getenv(token_secret)
        if not deployment_token:
            logger.warning(f"Deployment token {token_secret} not found - deployment will be skipped")

        # Initialize agents
        codex_config = self.config['agent_config']['codex']
        jules_config = self.config['agent_config']['jules']

        self.codex = CodexAgent(
            api_key=os.getenv('OPENAI_API_KEY'),
            model=codex_config['model'],
            temperature=codex_config['temperature']
        )

        self.jules = JulesAgent(
            api_key=os.getenv('GEMINI_API_KEY'),
            model=jules_config['model'],
            temperature=jules_config['temperature']
        )

        self.devops = DevOpsAgent(str(self.project_root))
        self.verifier = VerifierAgent()

        self.deployment_token = deployment_token

    def print_header(self, title: str):
        """Print a formatted header."""
        print(f"\n{Fore.CYAN}{'=' * 80}")
        print(f"{Fore.CYAN}{title.center(80)}")
        print(f"{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}\n")

    def print_status(self, message: str, status: str = "INFO"):
        """Print a status message with color."""
        colors = {
            "INFO": Fore.BLUE,
            "SUCCESS": Fore.GREEN,
            "WARNING": Fore.YELLOW,
            "ERROR": Fore.RED
        }
        color = colors.get(status, Fore.WHITE)
        print(f"{color}[{status}] {message}{Style.RESET_ALL}")

    def run_quality_gates(self) -> Tuple[bool, Dict[str, bool]]:
        """
        Run all quality gates defined in config.

        Returns:
            (all_passed, results) tuple
        """
        self.print_header(f"QUALITY GATES - Iteration {self.iteration}")

        results = {}

        for gate in self.config['quality_gates']:
            gate_name = gate['name']
            self.print_status(f"Running gate: {gate_name}")

            if 'command' in gate:
                # Command-based gate
                try:
                    result = subprocess.run(
                        gate['command'].split(),
                        capture_output=True,
                        text=True,
                        timeout=gate.get('timeout', 60),
                        cwd=self.project_root
                    )

                    output = result.stdout + result.stderr

                    # Check success pattern
                    if 'success_pattern' in gate:
                        passed = gate['success_pattern'] in output
                    # Check fail pattern
                    elif 'fail_pattern' in gate:
                        passed = gate['fail_pattern'] not in output
                    else:
                        passed = result.returncode == 0

                    results[gate_name] = passed

                    if passed:
                        self.print_status(f"✓ {gate_name}", "SUCCESS")
                    else:
                        self.print_status(f"✗ {gate_name}", "ERROR")

                except subprocess.TimeoutExpired:
                    results[gate_name] = False
                    self.print_status(f"✗ {gate_name} (timeout)", "ERROR")
                except Exception as e:
                    results[gate_name] = False
                    self.print_status(f"✗ {gate_name}: {str(e)}", "ERROR")

            elif 'url' in gate:
                # URL-based health check
                url = gate['url'].replace('${health_endpoint}', self.env_config['health_endpoint'])
                expected_status = gate.get('expect_status', 200)

                is_healthy, metrics = self.verifier.check_health(url, expected_status)
                results[gate_name] = is_healthy

                if is_healthy:
                    self.print_status(f"✓ {gate_name}", "SUCCESS")
                else:
                    self.print_status(f"✗ {gate_name}", "ERROR")

            elif gate.get('playwright_check'):
                # Playwright-based console error check
                url = self.env_config['health_endpoint']
                fail_patterns = gate.get('fail_patterns', [])

                has_errors, console_logs = self.verifier.check_console_errors(url, fail_patterns)
                results[gate_name] = not has_errors

                if not has_errors:
                    self.print_status(f"✓ {gate_name}", "SUCCESS")
                else:
                    self.print_status(f"✗ {gate_name}", "ERROR")
                    # Print error details
                    for log in console_logs:
                        if log['type'] in ['error', 'pageerror']:
                            print(f"  {Fore.RED}- {log['text']}{Style.RESET_ALL}")

        all_passed = all(results.values())
        return all_passed, results

    def gather_context(self) -> Dict[str, str]:
        """
        Gather repository context for error analysis.

        Returns:
            Dictionary with file contents and build output
        """
        self.print_status("Gathering repository context...")

        context = {}

        # Read vite.config.ts
        vite_config_path = self.project_root / "vite.config.ts"
        if vite_config_path.exists():
            with open(vite_config_path, 'r') as f:
                context['vite.config.ts'] = f.read()

        # Read package.json
        package_json_path = self.project_root / "package.json"
        if package_json_path.exists():
            with open(package_json_path, 'r') as f:
                context['package.json'] = f.read()

        # Run build to get error output
        self.print_status("Running build to capture errors...")
        success, stdout, stderr = self.devops.run_build()
        context['build_output'] = stdout + "\n" + stderr
        context['build_success'] = str(success)

        return context

    def apply_fixes(self, fixes: List[Tuple[str, str]]) -> bool:
        """
        Apply code fixes to the repository.

        Args:
            fixes: List of (filename, patch) tuples

        Returns:
            True if all fixes applied successfully
        """
        self.print_status(f"Applying {len(fixes)} fixes...")

        for filename, patch in fixes:
            try:
                file_path = self.project_root / filename
                self.print_status(f"Applying fix to {filename}")

                # For now, we'll use a simple approach:
                # Since patches are complex, we'll let the agent generate complete file content
                # In a production system, you'd use proper patch application

                # Save the patch to a temp file
                patch_file = self.project_root / f"{filename}.patch"
                with open(patch_file, 'w') as f:
                    f.write(patch)

                # Apply using git apply
                result = subprocess.run(
                    ["git", "apply", str(patch_file)],
                    capture_output=True,
                    text=True,
                    cwd=self.project_root
                )

                patch_file.unlink()  # Clean up

                if result.returncode == 0:
                    self.print_status(f"✓ Applied fix to {filename}", "SUCCESS")
                else:
                    self.print_status(f"✗ Failed to apply fix to {filename}: {result.stderr}", "ERROR")
                    return False

            except Exception as e:
                self.print_status(f"✗ Error applying fix to {filename}: {str(e)}", "ERROR")
                return False

        return True

    def create_git_commit(self, commit_message: str) -> bool:
        """
        Create a git commit with the changes.

        Args:
            commit_message: Commit message

        Returns:
            True if commit was successful
        """
        try:
            # Stage all changes
            subprocess.run(["git", "add", "."], check=True, cwd=self.project_root)

            # Create commit
            subprocess.run(
                ["git", "commit", "-m", commit_message],
                check=True,
                cwd=self.project_root
            )

            self.print_status("✓ Created git commit", "SUCCESS")
            return True

        except subprocess.CalledProcessError as e:
            self.print_status(f"✗ Failed to create commit: {str(e)}", "ERROR")
            return False

    def run_iteration(self) -> Tuple[bool, Dict[str, any]]:
        """
        Run a single orchestration iteration.

        Returns:
            (success, metrics) tuple
        """
        self.iteration += 1
        self.print_header(f"ITERATION {self.iteration}/{self.config['max_iterations']}")

        metrics = {
            "iteration": self.iteration,
            "timestamp": datetime.now().isoformat(),
            "steps": {}
        }

        # Step 1: Run quality gates
        all_passed, gate_results = self.run_quality_gates()
        metrics["steps"]["quality_gates"] = gate_results

        if all_passed:
            self.print_status("All quality gates passed!", "SUCCESS")
            return True, metrics

        # Step 2: Gather context
        context = self.gather_context()
        metrics["steps"]["context_gathered"] = True

        # Step 3: Analyze with Codex
        self.print_header("CODEX AGENT - Analyzing Error")
        error_log = context['build_output']

        diagnosis = self.codex.analyze_error(error_log, context)
        metrics["steps"]["codex_diagnosis"] = {
            "root_cause": diagnosis.get('root_cause'),
            "risk_level": diagnosis.get('risk_level'),
            "confidence": diagnosis.get('confidence')
        }

        self.print_status(f"Root Cause: {diagnosis.get('root_cause')}")
        self.print_status(f"Risk Level: {diagnosis.get('risk_level')}")
        self.print_status(f"Confidence: {diagnosis.get('confidence', 0):.0%}")

        # Check if diagnosis is same as previous iteration
        if self.previous_diagnosis and diagnosis.get('root_cause') == self.previous_diagnosis.get('root_cause'):
            self.print_status("No progress - same diagnosis as previous iteration", "WARNING")
            metrics["steps"]["no_progress"] = True
            return False, metrics

        self.previous_diagnosis = diagnosis

        # Step 4: Validate fix safety with Codex
        is_safe, warnings = self.codex.validate_fix_safety(
            diagnosis,
            self.config['safety']['protected_files']
        )

        if not is_safe:
            self.print_status("Fix validation failed:", "ERROR")
            for warning in warnings:
                self.print_status(f"  - {warning}", "WARNING")
            metrics["steps"]["safety_validation"] = False
            return False, metrics

        metrics["steps"]["safety_validation"] = True

        # Step 5: Review with Jules
        self.print_header("JULES AGENT - Reviewing Fix")

        fixes = self.codex.generate_fix(diagnosis)
        if not fixes:
            self.print_status("No fixes generated", "ERROR")
            return False, metrics

        # Combine all patches for review
        all_patches = "\n\n".join([f"--- {filename}\n{patch}" for filename, patch in fixes])

        review = self.jules.review_patch(diagnosis, all_patches)
        metrics["steps"]["jules_review"] = review

        print(self.jules.get_approval_summary(review))

        if not review.get('approved', False):
            self.print_status("Fix rejected by Jules", "ERROR")
            return False, metrics

        # Step 6: Apply fixes
        self.print_header("DEVOPS AGENT - Applying Fixes")

        if not self.apply_fixes(fixes):
            self.print_status("Failed to apply fixes", "ERROR")
            return False, metrics

        metrics["steps"]["fixes_applied"] = True

        # Step 7: Create git commit
        commit_message = self.codex.create_commit_message(diagnosis)
        if not self.create_git_commit(commit_message):
            self.print_status("Failed to create commit", "ERROR")
            return False, metrics

        # Step 8: Build
        self.print_header("DEVOPS AGENT - Building")

        build_success, stdout, stderr = self.devops.run_build()
        metrics["steps"]["build"] = {
            "success": build_success,
            "output_length": len(stdout) + len(stderr)
        }

        if not build_success:
            self.print_status("Build failed", "ERROR")
            return False, metrics

        self.print_status("✓ Build successful", "SUCCESS")

        # Check build output
        build_metrics = self.devops.check_build_output()
        metrics["steps"]["build_metrics"] = build_metrics

        # Step 9: Deploy (if token available)
        if self.deployment_token:
            self.print_header("DEVOPS AGENT - Deploying to Azure")

            deploy_success, deploy_url, deploy_error = self.devops.deploy_to_azure(
                self.deployment_token,
                self.env_config['azure_static_web_app_name'],
                self.environment
            )

            metrics["steps"]["deployment"] = {
                "success": deploy_success,
                "url": deploy_url,
                "error": deploy_error
            }

            if deploy_success:
                self.print_status(f"✓ Deployed to {deploy_url}", "SUCCESS")
            else:
                self.print_status(f"Deployment failed: {deploy_error}", "ERROR")
        else:
            self.print_status("Deployment token not available - skipping deployment", "WARNING")
            metrics["steps"]["deployment"] = {"skipped": True}

        # Step 10: Verify deployment
        self.print_header("VERIFIER AGENT - Running Smoke Tests")

        smoke_passed, smoke_results = self.verifier.run_smoke_test(self.env_config['health_endpoint'])
        metrics["steps"]["smoke_test"] = smoke_results

        if smoke_passed:
            self.print_status("✓ Smoke tests passed", "SUCCESS")
        else:
            self.print_status("Smoke tests failed", "ERROR")

        return smoke_passed, metrics

    def run(self) -> bool:
        """
        Run the orchestrator main loop.

        Returns:
            True if deployment was successful
        """
        self.print_header("MULTI-AGENT ORCHESTRATOR STARTING")

        self.print_status(f"Environment: {self.environment}")
        self.print_status(f"Project Root: {self.project_root}")
        self.print_status(f"Max Iterations: {self.config['max_iterations']}")

        all_metrics = []

        try:
            while self.iteration < self.config['max_iterations']:
                success, metrics = self.run_iteration()
                all_metrics.append(metrics)

                if success:
                    self.print_header("SUCCESS - ALL QUALITY GATES PASSED")
                    self._save_metrics(all_metrics)
                    return True

                # Check if we should stop
                if self.iteration >= self.config['max_iterations']:
                    self.print_status("Max iterations reached", "WARNING")
                    break

                if metrics["steps"].get("no_progress"):
                    self.print_status("No progress detected - stopping", "WARNING")
                    break

            # Failed to fix
            self.print_header("ORCHESTRATION FAILED")
            self.print_status(f"Completed {self.iteration} iterations without success", "ERROR")
            self._save_metrics(all_metrics)
            return False

        finally:
            self.verifier.cleanup()

    def _save_metrics(self, all_metrics: List[Dict]):
        """Save orchestration metrics to file."""
        metrics_file = self.project_root / "agent_orch" / "logs" / "orchestration_metrics.json"
        with open(metrics_file, 'w') as f:
            json.dump(all_metrics, f, indent=2)
        self.print_status(f"Metrics saved to {metrics_file}")


def main():
    parser = argparse.ArgumentParser(description="Multi-Agent Fleet Deployment Orchestrator")
    parser.add_argument(
        "--environment",
        choices=["staging", "prod"],
        default="staging",
        help="Deployment environment"
    )
    parser.add_argument(
        "--config",
        default="agent_orch/config.yaml",
        help="Path to config file"
    )

    args = parser.parse_args()

    try:
        orchestrator = MultiAgentOrchestrator(args.config, args.environment)
        success = orchestrator.run()
        sys.exit(0 if success else 1)

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
