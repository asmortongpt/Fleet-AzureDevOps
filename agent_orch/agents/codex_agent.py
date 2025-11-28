"""
CodexAgent - Code Generation & Patch Creation
Uses OpenAI GPT-4 to analyze errors and generate fixes
"""

import logging
import os
from typing import Dict, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class CodexAgent:
    """
    CodexAgent uses GPT-4 to analyze build/deployment errors
    and generate unified git patches that fix the issues
    """
    
    def __init__(self, config: Dict):
        self.config = config
        agent_config = config.get('agents', {}).get('codex', {})
        
        self.model = agent_config.get('model', 'gpt-4')
        self.temperature = agent_config.get('temperature', 0.2)
        self.max_tokens = agent_config.get('max_tokens', 4000)
        self.system_prompt = agent_config.get('system_prompt', '')
        
        # Initialize OpenAI client
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=api_key)
        logger.info(f"✅ CodexAgent initialized (model: {self.model})")
    
    def analyze_error(
        self,
        error_log: str,
        context: Optional[Dict] = None
    ) -> str:
        """
        Analyze error and generate analysis
        
        Args:
            error_log: Error output from build/deployment
            context: Additional context (files, config, etc.)
        
        Returns:
            Analysis text
        """
        logger.info("🔍 Analyzing error with GPT-4")
        
        user_prompt = f"""
Analyze this build/deployment error and provide:
1. Root cause analysis
2. Impact assessment
3. Recommended fix approach

ERROR LOG:
{error_log}
"""
        
        if context:
            user_prompt += f"\n\nADDITIONAL CONTEXT:\n{self._format_context(context)}"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            analysis = response.choices[0].message.content
            logger.info("✅ Analysis complete")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Analysis failed: {str(e)}")
            raise
    
    def generate_patch(
        self,
        error_log: str,
        current_files: Dict[str, str],
        context: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Generate unified git patch to fix the error
        
        Args:
            error_log: Error output
            current_files: Dict of {filepath: content} for relevant files
            context: Additional context
        
        Returns:
            Unified git patch as string, or None if no fix needed
        """
        logger.info("🔧 Generating patch with GPT-4")
        
        # Build context for the AI
        files_context = "\n\n".join([
            f"=== {path} ===\n{content}"
            for path, content in current_files.items()
        ])
        
        user_prompt = f"""
Analyze this error and generate a UNIFIED GIT PATCH to fix it.

REQUIREMENTS:
- Use unified diff format (diff --git a/... b/...)
- Make MINIMAL changes only
- Never hardcode secrets
- Use parameterized queries ($1, $2, $3)
- Follow security best practices
- Prefer Azure DevOps hosted agents (7GB RAM) over ACR build (4GB RAM) for large builds

ERROR LOG:
{error_log}

CURRENT FILES:
{files_context}
"""
        
        if context:
            user_prompt += f"\n\nCONTEXT:\n{self._format_context(context)}"
        
        user_prompt += """

Generate ONLY the git patch. No explanations, just the patch content starting with "diff --git".
If no changes are needed, respond with "NO_PATCH_NEEDED".
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            patch = response.choices[0].message.content.strip()
            
            if "NO_PATCH_NEEDED" in patch:
                logger.info("ℹ️ No patch needed")
                return None
            
            # Validate patch format
            if not patch.startswith("diff --git"):
                logger.warning("⚠️ Response doesn't look like a patch, extracting...")
                # Try to extract patch from markdown code blocks
                if "```" in patch:
                    parts = patch.split("```")
                    for part in parts:
                        if "diff --git" in part:
                            # Remove language identifier if present
                            lines = part.split('\n')
                            if lines[0].strip() in ['diff', 'patch', '']:
                                patch = '\n'.join(lines[1:])
                            else:
                                patch = part
                            break
            
            logger.info(f"✅ Patch generated ({len(patch)} bytes)")
            logger.debug(f"Patch preview:\n{patch[:500]}...")
            
            return patch
            
        except Exception as e:
            logger.error(f"❌ Patch generation failed: {str(e)}")
            raise
    
    def suggest_build_strategy(self, error_log: str) -> Dict:
        """
        Suggest build strategy based on error analysis
        
        Returns:
            Dict with strategy recommendations
        """
        logger.info("💡 Analyzing build strategy")
        
        # Check for common patterns
        strategies = {
            'use_devops_agent': False,
            'increase_memory': False,
            'optimize_bundle': False,
            'split_build': False,
            'reasons': []
        }
        
        error_lower = error_log.lower()
        
        # Check for OOM / SIGKILL
        if any(pattern in error_lower for pattern in ['sigkill', 'killed', 'out of memory', 'oom']):
            strategies['use_devops_agent'] = True
            strategies['increase_memory'] = True
            strategies['reasons'].append(
                "Detected OOM/SIGKILL - ACR build (4GB) insufficient. "
                "Recommend Azure DevOps hosted agent (7GB RAM)."
            )
        
        # Check for large bundle
        if any(pattern in error_lower for pattern in ['chunk too large', 'bundle size', 'memory limit']):
            strategies['optimize_bundle'] = True
            strategies['reasons'].append(
                "Large bundle detected. Consider code splitting, tree shaking, or lazy loading."
            )
        
        logger.info(f"✅ Strategy suggestions: {strategies['reasons']}")
        return strategies
    
    def _format_context(self, context: Dict) -> str:
        """Format context dictionary for prompt"""
        lines = []
        for key, value in context.items():
            if isinstance(value, dict):
                lines.append(f"{key}:")
                for k, v in value.items():
                    lines.append(f"  {k}: {v}")
            else:
                lines.append(f"{key}: {value}")
        return "\n".join(lines)
