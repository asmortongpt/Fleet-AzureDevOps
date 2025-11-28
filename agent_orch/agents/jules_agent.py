"""
JulesAgent - Code Review & Approval
Uses OpenAI GPT-4 to review patches and approve/reject with security focus
"""

import logging
import os
from typing import Dict, Tuple
from openai import OpenAI

logger = logging.getLogger(__name__)


class JulesAgent:
    """
    JulesAgent reviews code patches with focus on security and best practices
    """
    
    def __init__(self, config: Dict):
        self.config = config
        agent_config = config.get('agents', {}).get('jules', {})
        
        self.model = agent_config.get('model', 'gpt-4')
        self.temperature = agent_config.get('temperature', 0.1)
        self.max_tokens = agent_config.get('max_tokens', 2000)
        self.system_prompt = agent_config.get('system_prompt', '')
        
        # Initialize OpenAI client
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=api_key)
        logger.info(f"✅ JulesAgent initialized (model: {self.model})")
    
    def review_patch(
        self,
        patch: str,
        error_context: str = "",
        original_files: Dict[str, str] = None
    ) -> Tuple[bool, str, Dict]:
        """
        Review patch and approve or reject
        
        Args:
            patch: Git patch content
            error_context: Original error that patch is fixing
            original_files: Original file contents for context
        
        Returns:
            Tuple[bool, str, Dict]: (approved, reasoning, metadata)
        """
        logger.info("👀 Reviewing patch with GPT-4")
        
        user_prompt = f"""
Review this git patch and respond with APPROVE or REJECT.

SECURITY CHECKLIST:
- ✓ No hardcoded secrets (API keys, passwords, tokens)
- ✓ No SQL injection vulnerabilities (use $1, $2, $3 parameterized queries)
- ✓ No command injection (no shell=True with user input)
- ✓ No security headers removed
- ✓ No authentication/authorization bypassed
- ✓ No sensitive data exposure

QUALITY CHECKLIST:
- ✓ Changes are minimal and targeted
- ✓ No breaking changes to existing functionality
- ✓ Follows project conventions
- ✓ Error handling preserved or improved

PATCH TO REVIEW:
{patch}
"""
        
        if error_context:
            user_prompt += f"\n\nORIGINAL ERROR THIS FIXES:\n{error_context}"
        
        if original_files:
            files_preview = "\n\n".join([
                f"=== {path} (first 50 lines) ===\n" + "\n".join(content.split('\n')[:50])
                for path, content in list(original_files.items())[:3]
            ])
            user_prompt += f"\n\nORIGINAL FILES (CONTEXT):\n{files_preview}"
        
        user_prompt += """

RESPOND IN THIS FORMAT:
Decision: APPROVE or REJECT
Reasoning: [Your detailed reasoning]
Security Issues: [List any security concerns, or "None found"]
Recommendations: [Any suggestions for improvement]
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
            
            review = response.choices[0].message.content
            
            # Parse response
            approved = "APPROVE" in review.upper() and "REJECT" not in review.split('\n')[0].upper()
            
            # Extract sections
            metadata = {
                'full_review': review,
                'security_issues': self._extract_section(review, 'Security Issues'),
                'recommendations': self._extract_section(review, 'Recommendations')
            }
            
            reasoning = self._extract_section(review, 'Reasoning') or review
            
            if approved:
                logger.info("✅ Patch APPROVED")
            else:
                logger.warning("❌ Patch REJECTED")
            
            logger.debug(f"Review reasoning: {reasoning[:200]}...")
            
            return approved, reasoning, metadata
            
        except Exception as e:
            logger.error(f"❌ Review failed: {str(e)}")
            raise
    
    def validate_security(self, content: str) -> Tuple[bool, list]:
        """
        Perform security validation on content
        
        Returns:
            Tuple[bool, list]: (is_secure, list_of_issues)
        """
        issues = []
        
        # Check for hardcoded secrets patterns
        secret_patterns = [
            ('API key', r'["\']?api[_-]?key["\']?\s*[:=]\s*["\'][^"\']+["\']'),
            ('Password', r'["\']?password["\']?\s*[:=]\s*["\'][^"\']+["\']'),
            ('Token', r'["\']?token["\']?\s*[:=]\s*["\'][^"\']+["\']'),
            ('Secret', r'["\']?secret["\']?\s*[:=]\s*["\'][^"\']+["\']'),
        ]
        
        import re
        for name, pattern in secret_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                # Check if it's referencing an env var
                if 'process.env' not in content and 'os.getenv' not in content and '${' not in content:
                    issues.append(f"Potential hardcoded {name} detected")
        
        # Check for SQL injection
        sql_patterns = [
            r'execute\s*\(\s*["\']SELECT.*\+',
            r'query\s*\(\s*["\']SELECT.*\+',
            r'\.raw\s*\(\s*["\'].*\+',
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                issues.append("Potential SQL injection vulnerability (string concatenation in query)")
        
        # Check for command injection
        if re.search(r'exec\s*\(.*\+', content) or re.search(r'system\s*\(.*\+', content):
            issues.append("Potential command injection (string concatenation in exec/system)")
        
        is_secure = len(issues) == 0
        return is_secure, issues
    
    def _extract_section(self, text: str, section_name: str) -> str:
        """Extract a section from review text"""
        lines = text.split('\n')
        collecting = False
        section_lines = []
        
        for line in lines:
            if section_name.lower() in line.lower() and ':' in line:
                collecting = True
                # Get content after the colon
                parts = line.split(':', 1)
                if len(parts) > 1 and parts[1].strip():
                    section_lines.append(parts[1].strip())
                continue
            
            if collecting:
                # Stop at next section header (line with colon at end or all caps)
                if ':' in line and (line.strip().endswith(':') or line.strip().split(':')[0].isupper()):
                    break
                section_lines.append(line.strip())
        
        return ' '.join(section_lines).strip()
