#!/usr/bin/env python3
"""
Fleet UI Completeness Analysis - Real LLM Edition

This script runs the 10-agent UI completeness orchestrator with a REAL LLM
instead of the mock client. It searches the actual codebase and generates
a comprehensive analysis.

Supported LLM Providers:
- OpenAI (GPT-4 Turbo)
- Anthropic (Claude 3.5 Sonnet)
- Azure OpenAI

Usage:
  export OPENAI_API_KEY="sk-..."
  python3 run_with_real_llm.py --provider openai

  export ANTHROPIC_API_KEY="sk-ant-..."
  python3 run_with_real_llm.py --provider anthropic

  export AZURE_OPENAI_API_KEY="..."
  export AZURE_OPENAI_ENDPOINT="https://..."
  python3 run_with_real_llm.py --provider azure
"""

import os
import sys
import json
import glob
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Import our modules
from llm_integrations import OpenAIClient, AnthropicClient, AzureOpenAIClient
from ui_completeness_orchestrator import UICompletenessOrchestrator


class RealRAGClient:
    """
    Real RAG client that searches the actual Fleet codebase
    instead of using mock data.
    """

    def __init__(self, codebase_root: str = "/home/user/Fleet"):
        self.codebase_root = Path(codebase_root)
        self.documents = []
        self._index_codebase()

    def _index_codebase(self):
        """Index key files from the Fleet codebase"""
        print("📂 Indexing Fleet codebase...")

        # Key directories to search
        search_patterns = [
            "src/components/**/*.tsx",
            "src/pages/**/*.tsx",
            "src/lib/**/*.ts",
            "api/src/routes/**/*.ts",
            "api/src/services/**/*.ts",
        ]

        file_count = 0
        for pattern in search_patterns:
            full_pattern = str(self.codebase_root / pattern)
            for filepath in glob.glob(full_pattern, recursive=True):
                try:
                    # Skip node_modules, Pods, etc.
                    if any(skip in filepath for skip in ['node_modules', 'Pods', '.git', 'dist', 'build']):
                        continue

                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    # Extract key information
                    relative_path = Path(filepath).relative_to(self.codebase_root)
                    self.documents.append({
                        'source': str(relative_path),
                        'content': content[:5000],  # First 5KB
                        'size': len(content)
                    })
                    file_count += 1

                    # Limit to avoid overload
                    if file_count >= 100:
                        break

                except Exception as e:
                    print(f"   ⚠️  Skipped {filepath}: {e}")
                    continue

            if file_count >= 100:
                break

        print(f"   ✓ Indexed {len(self.documents)} files from Fleet codebase")

    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search indexed documents for relevant content.
        Simple keyword-based search for now.
        """
        results = []
        query_lower = query.lower()

        for doc in self.documents:
            # Simple relevance scoring
            score = 0
            content_lower = doc['content'].lower()

            # Check for query keywords
            for word in query_lower.split():
                if word in content_lower:
                    score += content_lower.count(word)

            if score > 0:
                results.append({
                    **doc,
                    'relevance_score': score
                })

        # Sort by relevance and return top results
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results[:limit]

    def add_document(self, source: str, doc_id: str, content: str):
        """Add a document to the index"""
        self.documents.append({
            'source': source,
            'content': content,
            'size': len(content)
        })


def detect_available_llm():
    """Detect which LLM providers have API keys configured"""
    providers = []

    if os.getenv('OPENAI_API_KEY'):
        providers.append('openai')
    if os.getenv('ANTHROPIC_API_KEY'):
        providers.append('anthropic')
    if os.getenv('AZURE_OPENAI_API_KEY') and os.getenv('AZURE_OPENAI_ENDPOINT'):
        providers.append('azure')

    return providers


def create_llm_client(provider: str):
    """Create the appropriate LLM client"""
    if provider == 'openai':
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        return OpenAIClient(
            api_key=api_key,
            model="gpt-4-turbo-preview",
            temperature=0.1,
            max_tokens=16000
        )

    elif provider == 'anthropic':
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        return AnthropicClient(
            api_key=api_key,
            model="claude-3-5-sonnet-20241022",
            temperature=0.1,
            max_tokens=16000
        )

    elif provider == 'azure':
        api_key = os.getenv('AZURE_OPENAI_API_KEY')
        endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        if not api_key or not endpoint:
            raise ValueError("AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT required")
        return AzureOpenAIClient(
            api_key=api_key,
            endpoint=endpoint,
            deployment_name="gpt-4",
            temperature=0.1,
            max_tokens=16000
        )

    else:
        raise ValueError(f"Unknown provider: {provider}")


def main():
    parser = argparse.ArgumentParser(description='Run UI Completeness Orchestrator with Real LLM')
    parser.add_argument('--provider', choices=['openai', 'anthropic', 'azure'],
                       help='LLM provider to use')
    parser.add_argument('--output', default='fleet_spec_real_llm.json',
                       help='Output JSON file path')
    parser.add_argument('--codebase', default='/home/user/Fleet',
                       help='Path to Fleet codebase root')

    args = parser.parse_args()

    print("=" * 80)
    print("Fleet UI Completeness Analysis - Real LLM Edition")
    print("=" * 80)
    print()

    # Detect available providers
    available = detect_available_llm()
    if not available:
        print("❌ No LLM API keys found!")
        print()
        print("Please set one of the following:")
        print("  export OPENAI_API_KEY='sk-...'")
        print("  export ANTHROPIC_API_KEY='sk-ant-...'")
        print("  export AZURE_OPENAI_API_KEY='...' AZURE_OPENAI_ENDPOINT='https://...'")
        print()
        sys.exit(1)

    # Select provider
    if args.provider:
        if args.provider not in available:
            print(f"❌ Provider '{args.provider}' selected but API key not found")
            print(f"✓ Available providers: {', '.join(available)}")
            sys.exit(1)
        provider = args.provider
    else:
        provider = available[0]
        print(f"🤖 Auto-selected provider: {provider}")
        print(f"   (Available: {', '.join(available)})")
        print()

    # Initialize RAG client with real codebase
    print("1. Initializing RAG client with Fleet codebase...")
    rag = RealRAGClient(codebase_root=args.codebase)
    print()

    # Initialize LLM client
    print(f"2. Initializing {provider.upper()} LLM client...")
    try:
        llm = create_llm_client(provider)
        print(f"   ✓ Connected to {provider}")
        print()
    except Exception as e:
        print(f"   ❌ Failed to initialize LLM: {e}")
        sys.exit(1)

    # Create orchestrator
    print("3. Creating UI Completeness Orchestrator...")
    orchestrator = UICompletenessOrchestrator(rag, llm)
    print("   ✓ Orchestrator ready with 10 specialized agents")
    print()

    # Run analysis
    print("4. Running comprehensive analysis...")
    print("   ⏳ This may take 2-5 minutes depending on LLM speed...")
    print()

    try:
        spec = orchestrator.build_spec(
            system_name="Fleet",
            runtime_url="http://localhost:5173",
            roles=["admin", "dispatcher", "mechanic", "driver"]
        )
        print("   ✓ Analysis complete!")
        print()
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Save results
    print(f"5. Saving specification to {args.output}...")
    with open(args.output, 'w') as f:
        json.dump(spec, f, indent=2)
    print(f"   ✓ Saved {os.path.getsize(args.output)} bytes")
    print()

    # Print summary
    print("=" * 80)
    print("Analysis Summary")
    print("=" * 80)
    print(f"Schema Version: {spec.get('schema_version', 'N/A')}")
    print(f"System: {spec.get('system', 'N/A')}")
    print(f"Pages Mapped: {len(spec.get('site_map', []))}")
    print(f"Page Audits: {len(spec.get('page_audits', []))}")
    print(f"Reactive Components: {len(spec.get('reactive_components', []))}")
    print(f"Analytics Events: {len(spec.get('analytics_spec', {}).get('events', []))}")
    print(f"Test Tasks: {len(spec.get('test_plan', []))}")
    print(f"Unknowns/Risks: {len(spec.get('unknowns', []))}")
    print()

    # Print unknowns
    if spec.get('unknowns'):
        print("⚠️  Unknowns Requiring Follow-up:")
        for unknown in spec['unknowns']:
            print(f"   Q: {unknown.get('question', 'N/A')}")
        print()

    # Print summary
    if spec.get('summary'):
        print("Summary:")
        print(spec['summary'])
        print()

    print("=" * 80)
    print("✅ Analysis Complete!")
    print("=" * 80)
    print()
    print("Next steps:")
    print(f"  1. Review specification: {args.output}")
    print("  2. Address any unknowns/risks identified")
    print("  3. Generate Playwright tests:")
    print(f"     python3 playwright_test_generator.py {args.output}")
    print("  4. Implement recommended improvements")
    print()


if __name__ == '__main__':
    main()
