#!/usr/bin/env python3
"""
Fleet Management Multi-Agent Orchestration System
Main orchestrator that coordinates CodexAgent, JulesAgent, and DevOpsAgent
"""

import sys
import os
import logging
import yaml
import argparse
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.codex_agent import CodexAgent
from agents.jules_agent import JulesAgent
from agents.devops_agent import DevOpsAgent
from tools.git import GitOperations
from tools.verifier import DeploymentVerifier

# Setup logging
def setup_logging(config: Dict):
    """Configure logging based on config"""
    log_config = config.get('logging', {})
    level = getattr(logging, log_config.get('level', 'INFO'))
    format_str = log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Create logs directory
    log_dir = Path(__file__).parent / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=level,
        format=format_str,
        handlers=[
            logging.FileHandler(log_dir / 'orchestrator.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )

logger = logging.getLogger(__name__)


class FleetOrchestrator:
    """
    Main orchestrator for Fleet Management deployment automation
    """
    
    def __init__(self, config_path: str, dry_run: bool = False):
        self.config_path = config_path
        self.dry_run = dry_run
        
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Setup logging
        setup_logging(self.config)
        
        logger.info("=" * 80)
        logger.info("🚀 Fleet Management Multi-Agent Orchestrator Starting")
        logger.info("=" * 80)
        logger.info(f"Config: {config_path}")
        logger.info(f"Dry Run: {dry_run}")
        
        # Get repo path (assume we're in repo/agent_orch)
        self.repo_path = Path(__file__).parent.parent.absolute()
        logger.info(f"Repo: {self.repo_path}")
        
        # Initialize agents
        self.codex = CodexAgent(self.config)
        self.jules = JulesAgent(self.config)
        self.devops = DevOpsAgent(self.config, dry_run)
        self.git = GitOperations(self.config, str(self.repo_path), dry_run)
        self.verifier = DeploymentVerifier(self.config)
        
        # Orchestration state
        self.iteration = 0
        self.max_iterations = self.config.get('agents', {}).get('orchestrator', {}).get('max_iterations', 10)
        self.no_progress_count = 0
        self.max_no_progress = self.config.get('agents', {}).get('orchestrator', {}).get('max_no_progress_iterations', 3)
        self.last_error = None
        
        logger.info("✅ Orchestrator initialized")
    
    def run_quality_gates(self) -> tuple[bool, Dict]:
        """
        Run all quality gates
        
        Returns:
            tuple[bool, Dict]: (all_passed, results)
        """
        logger.info("🚦 Running quality gates")
        
        gates = self.config.get('quality_gates', {})
        results = {}
        all_passed = True
        
        for gate_name, gate_config in gates.items():
            logger.info(f"📋 Quality gate: {gate_name}")
            
            command = gate_config.get('command')
            timeout = gate_config.get('timeout', 300)
            required = gate_config.get('required', True)
            
            try:
                code, stdout, stderr = self.devops.shell.execute(
                    command,
                    timeout=timeout,
                    cwd=str(self.repo_path)
                )
                
                passed = code == 0
                results[gate_name] = {
                    'passed': passed,
                    'required': required,
                    'exit_code': code,
                    'stdout': stdout[-500:] if stdout else '',
                    'stderr': stderr[-500:] if stderr else ''
                }
                
                if passed:
                    logger.info(f"✅ {gate_name}: PASS")
                else:
                    logger.warning(f"{'❌' if required else '⚠️'} {gate_name}: FAIL")
                    if required:
                        all_passed = False
                
            except Exception as e:
                logger.error(f"❌ {gate_name} error: {str(e)}")
                results[gate_name] = {
                    'passed': False,
                    'required': required,
                    'error': str(e)
                }
                if required:
                    all_passed = False
        
        return all_passed, results
    
    def orchestrate_fix(self, error_log: str) -> bool:
        """
        Main orchestration loop to fix an error
        
        Returns:
            bool: True if error was fixed
        """
        logger.info(f"🔄 Iteration {self.iteration + 1}/{self.max_iterations}")
        self.iteration += 1
        
        # 1. Analyze error with CodexAgent
        logger.info("🔍 Step 1: Error Analysis (CodexAgent)")
        analysis = self.codex.analyze_error(error_log)
        logger.info(f"Analysis: {analysis[:200]}...")
        
        # 2. Generate patch
        logger.info("🔧 Step 2: Patch Generation (CodexAgent)")
        
        # Get relevant files (read from disk)
        relevant_files = self._get_relevant_files(error_log)
        
        patch = self.codex.generate_patch(error_log, relevant_files)
        
        if not patch:
            logger.info("ℹ️ No patch needed or generated")
            return False
        
        # 3. Review patch with JulesAgent
        logger.info("👀 Step 3: Patch Review (JulesAgent)")
        approved, reasoning, metadata = self.jules.review_patch(
            patch,
            error_context=error_log,
            original_files=relevant_files
        )
        
        logger.info(f"Review result: {'APPROVED' if approved else 'REJECTED'}")
        logger.info(f"Reasoning: {reasoning[:200]}...")
        
        if not approved:
            logger.error("❌ Patch rejected by JulesAgent")
            logger.error(f"Security issues: {metadata.get('security_issues', 'N/A')}")
            return False
        
        # 4. Apply patch
        logger.info("📝 Step 4: Applying Patch")
        
        if not self.git.apply_patch(patch):
            logger.error("❌ Failed to apply patch")
            return False
        
        # 5. Commit changes
        logger.info("💾 Step 5: Committing Changes")
        
        commit_message = f"fix: Auto-fix by orchestrator (iteration {self.iteration})\n\n{analysis[:500]}"
        
        if not self.git.commit(commit_message):
            logger.error("❌ Failed to commit changes")
            return False
        
        # 6. Re-run quality gates
        logger.info("🚦 Step 6: Re-running Quality Gates")
        
        passed, results = self.run_quality_gates()
        
        if passed:
            logger.info("✅ All quality gates passed!")
            return True
        else:
            logger.warning("⚠️ Some quality gates still failing")
            return False
    
    def run(self, environment: str = "staging") -> bool:
        """
        Main orchestration loop
        
        Returns:
            bool: True if deployment successful
        """
        logger.info(f"🎯 Starting orchestration for {environment}")
        
        # 1. Git safety checks
        logger.info("🔐 Step 1: Git Safety Checks")
        
        if not self.git.fetch():
            logger.error("❌ Failed to fetch from remote")
            return False
        
        # Create backup branch
        backup_branch = self.git.create_backup_branch()
        if not backup_branch:
            logger.warning("⚠️ Failed to create backup branch (continuing anyway)")
        
        # 2. Initial quality gates
        logger.info("🚦 Step 2: Initial Quality Gates")
        
        passed, results = self.run_quality_gates()
        
        # If all passed, proceed to deployment
        if passed:
            logger.info("✅ All quality gates passed - proceeding to deployment")
            return self.deploy_environment(environment)
        
        # 3. Iterative fix loop
        logger.info("🔄 Step 3: Iterative Fix Loop")
        
        while self.iteration < self.max_iterations:
            # Extract error from quality gate results
            error_log = self._extract_error_log(results)
            
            # Check if we've seen this error before (no progress)
            if error_log == self.last_error:
                self.no_progress_count += 1
                logger.warning(f"⚠️ No progress detected ({self.no_progress_count}/{self.max_no_progress})")
                
                if self.no_progress_count >= self.max_no_progress:
                    logger.error("❌ No progress after multiple iterations - stopping")
                    return False
            else:
                self.no_progress_count = 0
            
            self.last_error = error_log
            
            # Attempt to fix
            fixed = self.orchestrate_fix(error_log)
            
            if fixed:
                logger.info("✅ Issue fixed - proceeding to deployment")
                return self.deploy_environment(environment)
        
        logger.error(f"❌ Max iterations ({self.max_iterations}) reached without success")
        return False
    
    def deploy_environment(self, environment: str) -> bool:
        """
        Deploy to specified environment
        """
        logger.info(f"🚀 Deploying to {environment}")
        
        env_config = self.config.get('deployment', {}).get('environments', {}).get(environment, {})
        
        if not env_config:
            logger.error(f"❌ Environment {environment} not configured")
            return False
        
        # 1. Verify environment
        logger.info("✅ Deployment verification")
        
        passed, report = self.verifier.verify_environment(environment, env_config)
        
        # Save verification report
        report_path = Path(__file__).parent / 'logs' / f'verification_{environment}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"📊 Verification report saved: {report_path}")
        
        if passed:
            logger.info(f"✅ {environment} deployment SUCCESSFUL")
            return True
        else:
            logger.error(f"❌ {environment} deployment FAILED")
            return False
    
    def _get_relevant_files(self, error_log: str) -> Dict[str, str]:
        """Extract and read relevant files based on error"""
        files = {}
        
        # Common files to check
        common_files = [
            'package.json',
            'Dockerfile',
            'azure-pipelines.yml',
            'vite.config.ts',
            'tsconfig.json'
        ]
        
        for filename in common_files:
            filepath = self.repo_path / filename
            if filepath.exists():
                try:
                    with open(filepath, 'r') as f:
                        files[filename] = f.read()
                except Exception as e:
                    logger.warning(f"⚠️ Failed to read {filename}: {str(e)}")
        
        return files
    
    def _extract_error_log(self, results: Dict) -> str:
        """Extract error information from quality gate results"""
        errors = []
        
        for gate_name, result in results.items():
            if not result.get('passed', False):
                errors.append(f"=== {gate_name} ===")
                errors.append(result.get('stderr', ''))
                errors.append(result.get('stdout', ''))
        
        return "\n\n".join(errors)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Fleet Management Multi-Agent Orchestrator')
    parser.add_argument('--config', default='config.yaml', help='Path to config file')
    parser.add_argument('--environment', default='staging', choices=['staging', 'prod'], help='Target environment')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode (no actual changes)')
    
    args = parser.parse_args()
    
    # Resolve config path
    config_path = Path(__file__).parent / args.config
    
    if not config_path.exists():
        print(f"❌ Config file not found: {config_path}")
        sys.exit(1)
    
    try:
        orchestrator = FleetOrchestrator(str(config_path), args.dry_run)
        success = orchestrator.run(args.environment)
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        logger.exception("❌ Orchestrator failed with exception")
        sys.exit(1)


if __name__ == '__main__':
    main()
