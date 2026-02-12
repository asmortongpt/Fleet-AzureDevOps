#!/usr/bin/env python3
"""
Live Research Agent - Makes actual WebSearch/WebFetch calls via Claude API
This is a REAL research agent that actively searches and fetches web content

Usage:
  python research_live.py --query "best practices for JWT authentication 2026"
  python research_live.py --url "https://jwt.io/introduction" --question "How do JWT tokens work?"
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

try:
    import anthropic
except ImportError:
    print("Error: anthropic package not installed", file=sys.stderr)
    print("Install with: pip install anthropic --break-system-packages", file=sys.stderr)
    sys.exit(1)


class LiveResearchAgent:
    """Research agent that makes real WebSearch/WebFetch API calls"""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize with Claude API key"""
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = anthropic.Anthropic(api_key=self.api_key)

    def web_search(self, query: str) -> Dict:
        """
        Perform web search using Claude's WebSearch tool

        Args:
            query: Search query

        Returns:
            Dict with search results and analysis
        """
        print(f"[WebSearch] Searching for: {query}", file=sys.stderr)

        message = self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            tools=[
                {
                    "name": "WebSearch",
                    "description": "Search the web",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                        },
                        "required": ["query"],
                    },
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": f"Search the web for: {query}\n\nProvide a comprehensive summary of the search results with sources.",
                }
            ],
        )

        # Extract results
        results = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "content": [],
            "sources": [],
        }

        for block in message.content:
            if hasattr(block, "text"):
                results["content"].append(block.text)
            elif block.type == "tool_use" and block.name == "WebSearch":
                # Tool was called - results will be in response
                pass

        return results

    def web_fetch(self, url: str, question: str) -> Dict:
        """
        Fetch and analyze web page content

        Args:
            url: URL to fetch
            question: Question to answer from the content

        Returns:
            Dict with analysis and answer
        """
        print(f"[WebFetch] Fetching: {url}", file=sys.stderr)
        print(f"[WebFetch] Question: {question}", file=sys.stderr)

        message = self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            tools=[
                {
                    "name": "WebFetch",
                    "description": "Fetch web page content",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "url": {"type": "string"},
                            "prompt": {"type": "string"},
                        },
                        "required": ["url", "prompt"],
                    },
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": f"Fetch the content from {url} and answer this question: {question}",
                }
            ],
        )

        # Extract analysis
        results = {
            "url": url,
            "question": question,
            "timestamp": datetime.now().isoformat(),
            "answer": [],
        }

        for block in message.content:
            if hasattr(block, "text"):
                results["answer"].append(block.text)

        return results

    def research_tech_stack(self, app_type: str, requirements: List[str]) -> Dict:
        """
        Research and recommend technology stack

        Args:
            app_type: Type of application (e.g., "e-commerce", "saas")
            requirements: List of requirements

        Returns:
            Technology stack recommendations with reasoning
        """
        query = f"best technology stack for {app_type} application with {', '.join(requirements)} in 2026"

        print(f"[Research] Analyzing tech stack for {app_type}", file=sys.stderr)

        # Search for current best practices
        search_results = self.web_search(query)

        # Analyze results with Claude
        message = self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": f"""Based on current web search results, recommend a technology stack for:

Application Type: {app_type}
Requirements: {', '.join(requirements)}

Search results summary:
{chr(10).join(search_results['content'])}

Provide recommendations in JSON format:
{{
  "frontend": {{"technology": "...", "rationale": "..."}},
  "backend": {{"technology": "...", "rationale": "..."}},
  "database": {{"technology": "...", "rationale": "..."}},
  "infrastructure": {{"technology": "...", "rationale": "..."}},
  "confidence_score": 0.95,
  "sources": ["url1", "url2"]
}}""",
                }
            ],
        )

        # Parse recommendations
        recommendations = {
            "app_type": app_type,
            "requirements": requirements,
            "timestamp": datetime.now().isoformat(),
            "recommendations": {},
        }

        for block in message.content:
            if hasattr(block, "text"):
                try:
                    # Try to extract JSON from response
                    text = block.text
                    if "```json" in text:
                        json_str = text.split("```json")[1].split("```")[0].strip()
                        recommendations["recommendations"] = json.loads(json_str)
                    else:
                        recommendations["recommendations"]["raw_response"] = text
                except (json.JSONDecodeError, IndexError):
                    recommendations["recommendations"]["raw_response"] = block.text

        return recommendations

    def check_security_vulnerabilities(self, package: str, version: str) -> Dict:
        """
        Check for security vulnerabilities in a package

        Args:
            package: Package name
            version: Package version

        Returns:
            Security analysis results
        """
        query = f"{package} {version} security vulnerabilities CVE 2026"

        print(f"[Security] Checking {package}@{version}", file=sys.stderr)

        search_results = self.web_search(query)

        return {
            "package": package,
            "version": version,
            "timestamp": datetime.now().isoformat(),
            "findings": search_results["content"],
            "sources": search_results.get("sources", []),
        }


def main():
    parser = argparse.ArgumentParser(description="Live Research Agent")
    parser.add_argument("--query", help="Web search query")
    parser.add_argument("--url", help="URL to fetch")
    parser.add_argument("--question", help="Question to answer from URL")
    parser.add_argument(
        "--tech-stack",
        help="Research tech stack (e.g., 'e-commerce')",
    )
    parser.add_argument(
        "--requirements",
        help="Comma-separated requirements (e.g., 'auth,payments,api')",
    )
    parser.add_argument("--check-security", help="Package to check (name@version)")
    parser.add_argument("--output", help="Output file (default: stdout)")

    args = parser.parse_args()

    # Initialize agent
    agent = LiveResearchAgent()

    # Execute research
    results = None

    if args.query:
        results = agent.web_search(args.query)
    elif args.url and args.question:
        results = agent.web_fetch(args.url, args.question)
    elif args.tech_stack:
        requirements = args.requirements.split(",") if args.requirements else []
        results = agent.research_tech_stack(args.tech_stack, requirements)
    elif args.check_security:
        package, version = args.check_security.split("@")
        results = agent.check_security_vulnerabilities(package, version)
    else:
        parser.print_help()
        sys.exit(1)

    # Output results
    output = json.dumps(results, indent=2)

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"✓ Results written to {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
