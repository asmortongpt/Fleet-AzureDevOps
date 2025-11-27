#!/usr/bin/env python3
"""
Jules Agent - Uses Google Gemini to review code patches.
This agent acts as a safety gatekeeper, reviewing all proposed changes
before they are applied to ensure they are safe and won't break production.
"""

import os
import json
import logging
from typing import Dict, List, Tuple
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class JulesAgent:
    """Gemini-powered code review agent that validates proposed changes."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-pro", temperature: float = 0.1):
        """
        Initialize the Jules Agent.

        Args:
            api_key: Google Gemini API key
            model: Model to use (default: gemini-1.5-pro)
            temperature: Sampling temperature (default: 0.1 for conservative reviews)
        """
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name=model,
            generation_config={
                "temperature": temperature,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2000,
            }
        )
        logger.info(f"Initialized JulesAgent with model={model}, temperature={temperature}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def review_patch(self, diagnosis: Dict[str, any], patch_content: str) -> Dict[str, any]:
        """
        Review a code patch for safety and correctness.

        Args:
            diagnosis: The diagnosis from Codex agent
            patch_content: Unified diff patch content

        Returns:
            Dictionary with review results
        """
        logger.info("Reviewing patch with Google Gemini...")

        prompt = f"""You are a senior code reviewer specializing in production safety.
Review this patch and determine if it is safe to apply.

## Proposed Change

### Root Cause Analysis
{diagnosis.get('root_cause', 'Not provided')}

### Explanation
{diagnosis.get('explanation', 'Not provided')}

### Risk Level
{diagnosis.get('risk_level', 'UNKNOWN')}

### Patch
```diff
{patch_content}
```

## Review Criteria

REJECT if the patch:
- Deletes files or Azure resources
- Modifies secrets or credentials
- Introduces security vulnerabilities
- Uses deprecated or dangerous patterns
- Has syntax errors
- Removes error handling
- Breaks existing functionality

APPROVE if the patch:
- Makes minimal, surgical changes
- Uses well-tested patterns
- Includes proper error handling
- Maintains backward compatibility
- Follows security best practices

Provide response as JSON:
{{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "concerns": ["list of specific concerns"],
  "recommendations": ["list of improvements"],
  "risk_assessment": "LOW|MEDIUM|HIGH",
  "summary": "brief review summary"
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text

            # Extract JSON from response (may be wrapped in markdown)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            logger.info(f"Review complete. Approved: {result.get('approved', False)}")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
            logger.error(f"Raw response: {result_text}")
            # Return a safe default (reject)
            return {
                "approved": False,
                "confidence": 0.0,
                "concerns": ["Failed to parse review response"],
                "recommendations": [],
                "risk_assessment": "HIGH",
                "summary": "Review failed - rejecting for safety"
            }
        except Exception as e:
            logger.error(f"Error during review: {str(e)}")
            raise

    def validate_changes(self, fixes: List[Tuple[str, str]]) -> Tuple[bool, List[str]]:
        """
        Validate a list of file changes for common safety issues.

        Args:
            fixes: List of (filename, patch) tuples

        Returns:
            (is_safe, issues) tuple
        """
        issues = []
        is_safe = True

        for filename, patch in fixes:
            # Check for dangerous file modifications
            if any(pattern in filename for pattern in ['.env', 'secret', 'credential', 'key', '.azure']):
                issues.append(f"Attempting to modify sensitive file: {filename}")
                is_safe = False

            # Check for file deletions
            if 'deleted file mode' in patch or '--- a/' in patch and '+++ /dev/null' in patch:
                issues.append(f"Attempting to delete file: {filename}")
                is_safe = False

            # Check for dangerous operations
            dangerous_patterns = [
                'rm -rf',
                'DROP TABLE',
                'DELETE FROM',
                'az group delete',
                'kubectl delete',
                'docker rmi',
                'git push --force'
            ]
            for pattern in dangerous_patterns:
                if pattern in patch:
                    issues.append(f"Dangerous operation detected in {filename}: {pattern}")
                    is_safe = False

        if is_safe:
            logger.info("Change validation passed")
        else:
            logger.warning(f"Change validation failed: {', '.join(issues)}")

        return is_safe, issues

    def get_approval_summary(self, review: Dict[str, any]) -> str:
        """
        Generate a human-readable approval summary.

        Args:
            review: Review result from review_patch()

        Returns:
            Summary string
        """
        approved = review.get('approved', False)
        confidence = review.get('confidence', 0.0)
        risk = review.get('risk_assessment', 'UNKNOWN')
        summary = review.get('summary', 'No summary provided')

        status = "✓ APPROVED" if approved else "✗ REJECTED"

        msg = f"""
{status} (Confidence: {confidence:.0%}, Risk: {risk})

Summary: {summary}
"""

        concerns = review.get('concerns', [])
        if concerns:
            msg += f"\nConcerns:\n"
            for concern in concerns:
                msg += f"  - {concern}\n"

        recommendations = review.get('recommendations', [])
        if recommendations:
            msg += f"\nRecommendations:\n"
            for rec in recommendations:
                msg += f"  - {rec}\n"

        return msg


if __name__ == "__main__":
    # Test the agent
    import sys
    logging.basicConfig(level=logging.INFO)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    agent = JulesAgent(api_key)

    # Test diagnosis
    diagnosis = {
        "root_cause": "React module loading order issue",
        "explanation": "React-dependent libraries loading before React",
        "risk_level": "MEDIUM"
    }

    # Test patch
    patch = """
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -200,6 +200,10 @@
+          if (id.includes('node_modules/@floating-ui')) {
+            return 'react-utils';
+          }
"""

    review = agent.review_patch(diagnosis, patch)
    print(json.dumps(review, indent=2))
    print(agent.get_approval_summary(review))
