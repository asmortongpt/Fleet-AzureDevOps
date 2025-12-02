"""
Real LLM Client Integrations for UI Completeness Orchestrator

This module provides production-ready LLM client implementations for:
- OpenAI (GPT-4, GPT-4 Turbo)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Azure OpenAI

Replace the MockLLMClient in your examples with these for real analysis.
"""

from __future__ import annotations
import os
from typing import Optional
from ui_completeness_orchestrator import LLMClient


class OpenAIClient(LLMClient):
    """
    OpenAI client for UI completeness analysis.

    Supports GPT-4, GPT-4 Turbo, and other OpenAI models.

    Usage:
        client = OpenAIClient(
            api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4-turbo-preview"
        )
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4-turbo-preview",
        temperature: float = 0.1,
        max_tokens: int = 16000
    ):
        """
        Initialize OpenAI client.

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            model: Model to use (gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo)
            temperature: Sampling temperature (0.0-2.0, lower = more focused)
            max_tokens: Maximum tokens in response
        """
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )

        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OpenAI API key required. Set OPENAI_API_KEY env var or pass api_key parameter."
            )

        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.client = OpenAI(api_key=self.api_key)

    def complete(self, prompt: str) -> str:
        """
        Generate completion using OpenAI API.

        Args:
            prompt: The prompt to complete (MULTI_AGENT_SPIDER_PROMPT with context)

        Returns:
            JSON string with completeness specification
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert software QA architect specializing in comprehensive UI/product completeness analysis."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}  # Enforce JSON output
            )

            return response.choices[0].message.content

        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")


class AnthropicClient(LLMClient):
    """
    Anthropic Claude client for UI completeness analysis.

    Supports Claude 3 Opus, Sonnet, and Haiku.

    Usage:
        client = AnthropicClient(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            model="claude-3-opus-20240229"
        )
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-3-opus-20240229",
        temperature: float = 0.1,
        max_tokens: int = 4096
    ):
        """
        Initialize Anthropic client.

        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
            model: Model to use (claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307)
            temperature: Sampling temperature (0.0-1.0, lower = more focused)
            max_tokens: Maximum tokens in response
        """
        try:
            from anthropic import Anthropic
        except ImportError:
            raise ImportError(
                "Anthropic package not installed. Install with: pip install anthropic"
            )

        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Anthropic API key required. Set ANTHROPIC_API_KEY env var or pass api_key parameter."
            )

        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.client = Anthropic(api_key=self.api_key)

    def complete(self, prompt: str) -> str:
        """
        Generate completion using Anthropic API.

        Args:
            prompt: The prompt to complete (MULTI_AGENT_SPIDER_PROMPT with context)

        Returns:
            JSON string with completeness specification
        """
        try:
            # Add JSON-only instruction to prompt
            enhanced_prompt = f"""{prompt}

CRITICAL: Your response must be ONLY valid JSON. No markdown, no code blocks, no explanatory text.
Start with {{ and end with }}. Nothing else."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {
                        "role": "user",
                        "content": enhanced_prompt
                    }
                ]
            )

            return response.content[0].text

        except Exception as e:
            raise RuntimeError(f"Anthropic API error: {str(e)}")


class AzureOpenAIClient(LLMClient):
    """
    Azure OpenAI client for UI completeness analysis.

    For organizations using Azure-hosted OpenAI models.

    Usage:
        client = AzureOpenAIClient(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            deployment_name="gpt-4-deployment"
        )
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        deployment_name: str = "gpt-4",
        api_version: str = "2024-02-15-preview",
        temperature: float = 0.1,
        max_tokens: int = 16000
    ):
        """
        Initialize Azure OpenAI client.

        Args:
            api_key: Azure OpenAI API key (defaults to AZURE_OPENAI_API_KEY env var)
            endpoint: Azure OpenAI endpoint URL (defaults to AZURE_OPENAI_ENDPOINT env var)
            deployment_name: Name of your GPT-4 deployment in Azure
            api_version: Azure OpenAI API version
            temperature: Sampling temperature (0.0-2.0, lower = more focused)
            max_tokens: Maximum tokens in response
        """
        try:
            from openai import AzureOpenAI
        except ImportError:
            raise ImportError(
                "OpenAI package not installed. Install with: pip install openai"
            )

        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.endpoint = endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")

        if not self.api_key or not self.endpoint:
            raise ValueError(
                "Azure OpenAI API key and endpoint required. "
                "Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT env vars."
            )

        self.deployment_name = deployment_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        self.client = AzureOpenAI(
            api_key=self.api_key,
            api_version=api_version,
            azure_endpoint=self.endpoint
        )

    def complete(self, prompt: str) -> str:
        """
        Generate completion using Azure OpenAI API.

        Args:
            prompt: The prompt to complete (MULTI_AGENT_SPIDER_PROMPT with context)

        Returns:
            JSON string with completeness specification
        """
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,  # Azure uses deployment name instead of model
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert software QA architect specializing in comprehensive UI/product completeness analysis."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}
            )

            return response.choices[0].message.content

        except Exception as e:
            raise RuntimeError(f"Azure OpenAI API error: {str(e)}")


# Example usage
if __name__ == "__main__":
    import sys
    from pathlib import Path

    # Add parent directory to path
    sys.path.insert(0, str(Path(__file__).parent))

    from ui_completeness_orchestrator import UICompletenessOrchestrator
    from rag_client import InMemoryRAGClient

    print("LLM Client Integration Examples")
    print("=" * 70)
    print()

    # Example 1: OpenAI
    print("1. OpenAI Client Example:")
    print("   ```python")
    print("   from llm_integrations import OpenAIClient")
    print("   from ui_completeness_orchestrator import UICompletenessOrchestrator")
    print("   from rag_client import InMemoryRAGClient")
    print()
    print("   llm = OpenAIClient(")
    print("       api_key=os.getenv('OPENAI_API_KEY'),")
    print("       model='gpt-4-turbo-preview'")
    print("   )")
    print("   rag = InMemoryRAGClient()")
    print("   orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)")
    print("   spec = orchestrator.build_completeness_spec('Fleet', 'https://fleet.example.com')")
    print("   ```")
    print()

    # Example 2: Anthropic
    print("2. Anthropic Claude Client Example:")
    print("   ```python")
    print("   from llm_integrations import AnthropicClient")
    print()
    print("   llm = AnthropicClient(")
    print("       api_key=os.getenv('ANTHROPIC_API_KEY'),")
    print("       model='claude-3-opus-20240229'")
    print("   )")
    print("   orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)")
    print("   spec = orchestrator.build_completeness_spec('Fleet')")
    print("   ```")
    print()

    # Example 3: Azure OpenAI
    print("3. Azure OpenAI Client Example:")
    print("   ```python")
    print("   from llm_integrations import AzureOpenAIClient")
    print()
    print("   llm = AzureOpenAIClient(")
    print("       api_key=os.getenv('AZURE_OPENAI_API_KEY'),")
    print("       endpoint=os.getenv('AZURE_OPENAI_ENDPOINT'),")
    print("       deployment_name='gpt-4-deployment'")
    print("   )")
    print("   orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)")
    print("   spec = orchestrator.build_completeness_spec('Fleet')")
    print("   ```")
    print()

    print("=" * 70)
    print("Set your API keys as environment variables:")
    print("  export OPENAI_API_KEY='your-key-here'")
    print("  export ANTHROPIC_API_KEY='your-key-here'")
    print("  export AZURE_OPENAI_API_KEY='your-key-here'")
    print("  export AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/'")
