"""
Shell Executor Tool
Safe shell command execution with logging and timeout support
"""

import subprocess
import logging
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class ShellExecutor:
    """
    Safe shell command executor with comprehensive logging and error handling
    """
    
    def __init__(self, config: Dict, dry_run: bool = False):
        self.config = config
        self.dry_run = dry_run
        self.forbidden_commands = config.get('safety', {}).get('forbidden_commands', [])
        self.log_dir = config.get('agents', {}).get('orchestrator', {}).get('log_file', 'logs/orchestrator.log')
        
    def is_safe_command(self, command: str) -> Tuple[bool, Optional[str]]:
        """
        Check if command is safe to execute
        
        Returns:
            Tuple[bool, Optional[str]]: (is_safe, reason_if_unsafe)
        """
        # Check against forbidden commands
        for forbidden in self.forbidden_commands:
            if forbidden.lower() in command.lower():
                return False, f"Command contains forbidden pattern: {forbidden}"
        
        # Check for dangerous patterns
        dangerous_patterns = [
            'rm -rf /',
            'dd if=',
            'mkfs.',
            '> /dev/sd',
            'sudo su',
            'chmod 777',
        ]
        
        for pattern in dangerous_patterns:
            if pattern in command:
                return False, f"Command contains dangerous pattern: {pattern}"
        
        return True, None
    
    def execute(
        self,
        command: str,
        timeout: int = 300,
        cwd: Optional[str] = None,
        env: Optional[Dict] = None,
        capture_output: bool = True
    ) -> Tuple[int, str, str]:
        """
        Execute shell command with safety checks
        
        Args:
            command: Shell command to execute
            timeout: Timeout in seconds
            cwd: Working directory
            env: Environment variables
            capture_output: Whether to capture stdout/stderr
        
        Returns:
            Tuple[int, str, str]: (return_code, stdout, stderr)
        """
        # Safety check
        is_safe, reason = self.is_safe_command(command)
        if not is_safe:
            logger.error(f"🚫 BLOCKED: {reason}")
            raise ValueError(f"Unsafe command blocked: {reason}")
        
        logger.info(f"🔧 Executing: {command}")
        
        if self.dry_run:
            logger.info(f"🏃 DRY RUN MODE - Would execute: {command}")
            return 0, f"[DRY RUN] {command}", ""
        
        # Prepare environment
        exec_env = os.environ.copy()
        if env:
            exec_env.update(env)
        
        # Execute command
        try:
            start_time = datetime.now()
            
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                env=exec_env,
                timeout=timeout,
                capture_output=capture_output,
                text=True
            )
            
            elapsed = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"✅ Command completed in {elapsed:.2f}s (exit code: {result.returncode})")
            
            if result.returncode != 0:
                logger.warning(f"⚠️ Non-zero exit code: {result.returncode}")
                logger.warning(f"STDERR: {result.stderr}")
            
            return result.returncode, result.stdout, result.stderr
            
        except subprocess.TimeoutExpired:
            logger.error(f"⏱️ Command timed out after {timeout}s")
            raise
            
        except Exception as e:
            logger.error(f"❌ Command failed: {str(e)}")
            raise
    
    def execute_with_retry(
        self,
        command: str,
        max_retries: int = 3,
        timeout: int = 300,
        **kwargs
    ) -> Tuple[int, str, str]:
        """
        Execute command with retry logic
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"🔄 Attempt {attempt + 1}/{max_retries}")
                return self.execute(command, timeout=timeout, **kwargs)
                
            except Exception as e:
                last_error = e
                logger.warning(f"⚠️ Attempt {attempt + 1} failed: {str(e)}")
                
                if attempt < max_retries - 1:
                    logger.info(f"⏳ Retrying in 5 seconds...")
                    import time
                    time.sleep(5)
        
        logger.error(f"❌ All {max_retries} attempts failed")
        raise last_error
    
    def execute_pipeline(self, commands: List[str], **kwargs) -> List[Tuple[int, str, str]]:
        """
        Execute a pipeline of commands in sequence
        
        Args:
            commands: List of commands to execute
            **kwargs: Additional arguments passed to execute()
        
        Returns:
            List of (return_code, stdout, stderr) tuples
        """
        results = []
        
        for i, command in enumerate(commands):
            logger.info(f"📋 Pipeline step {i + 1}/{len(commands)}")
            
            try:
                result = self.execute(command, **kwargs)
                results.append(result)
                
                # Stop on first failure
                if result[0] != 0:
                    logger.error(f"❌ Pipeline failed at step {i + 1}")
                    break
                    
            except Exception as e:
                logger.error(f"❌ Pipeline failed at step {i + 1}: {str(e)}")
                raise
        
        return results
