"""
Git Operations Tool
Safe git operations with backup and verification
"""

import os
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import subprocess

logger = logging.getLogger(__name__)


class GitOperations:
    """
    Git operations handler with safety mechanisms
    """
    
    def __init__(self, config: Dict, repo_path: str, dry_run: bool = False):
        self.config = config
        self.repo_path = repo_path
        self.dry_run = dry_run
        self.backup_prefix = config.get('safety', {}).get('git', {}).get('backup_prefix', 'backup/pre-orchestration')
        
    def _execute_git(self, command: str) -> Tuple[int, str, str]:
        """Execute git command safely"""
        full_command = f"git -C {self.repo_path} {command}"
        logger.info(f"🔧 Git: {command}")
        
        if self.dry_run:
            return 0, f"[DRY RUN] {command}", ""
        
        result = subprocess.run(
            full_command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        return result.returncode, result.stdout, result.stderr
    
    def check_clean_state(self) -> bool:
        """Check if working directory is clean"""
        code, stdout, _ = self._execute_git("status --porcelain")
        return code == 0 and not stdout.strip()
    
    def fetch(self, remote: str = "origin") -> bool:
        """Fetch from remote"""
        logger.info(f"📥 Fetching from {remote}")
        code, _, stderr = self._execute_git(f"fetch {remote}")
        
        if code != 0:
            logger.error(f"❌ Fetch failed: {stderr}")
            return False
        
        logger.info("✅ Fetch successful")
        return True
    
    def get_current_branch(self) -> Optional[str]:
        """Get current branch name"""
        code, stdout, _ = self._execute_git("branch --show-current")
        return stdout.strip() if code == 0 else None
    
    def create_backup_branch(self) -> Optional[str]:
        """Create backup branch before making changes"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{self.backup_prefix}-{timestamp}"
        
        logger.info(f"💾 Creating backup branch: {backup_name}")
        code, _, stderr = self._execute_git(f"branch {backup_name}")
        
        if code != 0:
            logger.error(f"❌ Failed to create backup: {stderr}")
            return None
        
        logger.info(f"✅ Backup created: {backup_name}")
        return backup_name
    
    def apply_patch(self, patch_content: str, patch_file: Optional[str] = None) -> bool:
        """Apply git patch"""
        if not patch_file:
            patch_file = f"/tmp/orchestrator_patch_{datetime.now().strftime('%Y%m%d_%H%M%S')}.patch"
        
        # Write patch to file
        with open(patch_file, 'w') as f:
            f.write(patch_content)
        
        logger.info(f"📝 Applying patch from {patch_file}")
        
        # Try to apply patch
        code, stdout, stderr = self._execute_git(f"apply --check {patch_file}")
        
        if code != 0:
            logger.error(f"❌ Patch validation failed: {stderr}")
            return False
        
        # Apply the patch
        code, stdout, stderr = self._execute_git(f"apply {patch_file}")
        
        if code != 0:
            logger.error(f"❌ Patch application failed: {stderr}")
            return False
        
        logger.info("✅ Patch applied successfully")
        return True
    
    def commit(self, message: str, files: Optional[List[str]] = None) -> bool:
        """Commit changes"""
        # Add files
        if files:
            for file in files:
                code, _, stderr = self._execute_git(f"add {file}")
                if code != 0:
                    logger.error(f"❌ Failed to add {file}: {stderr}")
                    return False
        else:
            # Add all changes
            code, _, stderr = self._execute_git("add -A")
            if code != 0:
                logger.error(f"❌ Failed to add files: {stderr}")
                return False
        
        # Commit
        escaped_message = message.replace('"', '\\"')
        code, _, stderr = self._execute_git(f'commit -m "{escaped_message}"')
        
        if code != 0:
            logger.error(f"❌ Commit failed: {stderr}")
            return False
        
        logger.info(f"✅ Committed: {message}")
        return True
    
    def get_diff(self, staged: bool = False) -> str:
        """Get diff of changes"""
        cmd = "diff --cached" if staged else "diff"
        _, stdout, _ = self._execute_git(cmd)
        return stdout
    
    def get_status(self) -> str:
        """Get git status"""
        _, stdout, _ = self._execute_git("status")
        return stdout
    
    def push(self, remote: str = "origin", branch: Optional[str] = None, force: bool = False) -> bool:
        """Push to remote"""
        if not branch:
            branch = self.get_current_branch()
        
        if not branch:
            logger.error("❌ Cannot determine current branch")
            return False
        
        # Safety check for force push to main/master
        if force and branch in ['main', 'master']:
            logger.error("🚫 Force push to main/master is forbidden")
            return False
        
        force_flag = "--force" if force else ""
        logger.info(f"📤 Pushing to {remote}/{branch}")
        
        code, _, stderr = self._execute_git(f"push {force_flag} {remote} {branch}")
        
        if code != 0:
            logger.error(f"❌ Push failed: {stderr}")
            return False
        
        logger.info("✅ Push successful")
        return True
    
    def pull(self, remote: str = "origin", branch: Optional[str] = None) -> bool:
        """Pull from remote"""
        if not branch:
            branch = self.get_current_branch()
        
        logger.info(f"📥 Pulling from {remote}/{branch}")
        code, _, stderr = self._execute_git(f"pull {remote} {branch}")
        
        if code != 0:
            logger.error(f"❌ Pull failed: {stderr}")
            return False
        
        logger.info("✅ Pull successful")
        return True
