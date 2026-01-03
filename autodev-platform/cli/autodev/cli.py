"""
AutoDev CLI - Main Command Line Interface

Commands:
  autodev ingest       - Ingest codebase into RAG/CAG
  autodev plan         - Generate rebuild plan
  autodev branch       - Create branches for work items
  autodev rebuild      - Rebuild with QA loops
  autodev verify       - Run all quality gates
  autodev pr           - Create pull requests
  autodev merge-train  - Dependency-ordered merges
  autodev deploy       - Deploy to Azure
"""

import click
import httpx
import os
from rich.console import Console
from rich.progress import Progress
from pathlib import Path
import json

console = Console()

# Get orchestrator URL from environment or default
ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://localhost:8000")


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """AutoDev Platform - Autonomous Development System"""
    pass


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--namespace", default="default", help="RAG namespace")
def ingest(repo, namespace):
    """Ingest codebase into RAG/CAG memory systems."""
    console.print(f"[bold blue]Ingesting repository:[/bold blue] {repo}")
    console.print(f"[bold blue]Namespace:[/bold blue] {namespace}")

    repo_path = Path(repo).resolve()
    if not repo_path.exists():
        console.print(f"[bold red]Error:[/bold red] Repository not found: {repo}")
        return

    with Progress() as progress:
        task = progress.add_task("[cyan]Scanning files...", total=100)

        try:
            # Call orchestrator API
            response = httpx.post(
                f"{ORCHESTRATOR_URL}/ingest",
                json={"repo_path": str(repo_path), "namespace": namespace},
                timeout=300.0
            )
            response.raise_for_status()
            result = response.json()

            progress.update(task, completed=100)

            console.print(f"[bold green]✓ Ingestion complete[/bold green]")
            console.print(f"  Chunks indexed: {result.get('chunks', 0)}")
            console.print(f"  Files processed: {result.get('files', 0)}")

        except httpx.HTTPError as e:
            console.print(f"[bold red]Error:[/bold red] {e}")
        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--output", default="rebuild_plan.json", help="Output file")
def plan(repo, output):
    """Generate rebuild plan with work items and dependencies."""
    console.print(f"[bold blue]Generating plan for:[/bold blue] {repo}")

    repo_path = Path(repo).resolve()

    with Progress() as progress:
        task = progress.add_task("[cyan]Analyzing codebase...", total=100)

        try:
            response = httpx.post(
                f"{ORCHESTRATOR_URL}/plan",
                json={"repo_path": str(repo_path)},
                timeout=300.0
            )
            response.raise_for_status()
            plan_data = response.json()

            progress.update(task, completed=100)

            # Save plan to file
            output_path = Path(output)
            output_path.write_text(json.dumps(plan_data, indent=2))

            console.print(f"[bold green]✓ Plan generated[/bold green]")
            console.print(f"  Work items: {len(plan_data.get('work_items', []))}")
            console.print(f"  Output: {output}")

        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--mode", default="work-items", help="Branch creation mode")
def branch(repo, mode):
    """Create branches for work items."""
    console.print(f"[bold blue]Creating branches:[/bold blue] {repo}")

    try:
        response = httpx.post(
            f"{ORCHESTRATOR_URL}/branch",
            json={"repo_path": repo, "mode": mode},
            timeout=60.0
        )
        response.raise_for_status()
        result = response.json()

        console.print(f"[bold green]✓ Branches created[/bold green]")
        console.print(f"  Count: {result.get('count', 0)}")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--target", default="production", help="Target environment")
@click.option("--concurrency", default=4, help="Parallel work items")
def rebuild(repo, target, concurrency):
    """Rebuild application with QA and reflection loops."""
    console.print(f"[bold blue]Starting rebuild:[/bold blue] {repo}")
    console.print(f"[bold blue]Target:[/bold blue] {target}")
    console.print(f"[bold blue]Concurrency:[/bold blue] {concurrency}")

    try:
        response = httpx.post(
            f"{ORCHESTRATOR_URL}/rebuild",
            json={
                "repo_path": repo,
                "target": target,
                "concurrency": concurrency
            },
            timeout=None  # Long-running operation
        )

        # Stream progress
        for line in response.iter_lines():
            if line:
                console.print(line)

        console.print(f"[bold green]✓ Rebuild complete[/bold green]")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--all", is_flag=True, help="Run all quality gates")
@click.option("--gate", help="Specific gate to run")
def verify(repo, all, gate):
    """Run quality gates."""
    console.print(f"[bold blue]Running quality gates:[/bold blue] {repo}")

    gates_to_run = ["lint", "typecheck", "test", "coverage", "security", "no-ai-fingerprints"] if all else [gate]

    for gate_name in gates_to_run:
        console.print(f"\n[cyan]Running {gate_name}...[/cyan]")

        try:
            response = httpx.post(
                f"{ORCHESTRATOR_URL}/verify",
                json={"repo_path": repo, "gate": gate_name},
                timeout=300.0
            )
            response.raise_for_status()
            result = response.json()

            if result.get("passed"):
                console.print(f"[bold green]✓ {gate_name} passed[/bold green]")
            else:
                console.print(f"[bold red]✗ {gate_name} failed[/bold red]")
                if "errors" in result:
                    console.print(f"  Errors: {result['errors']}")

        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--work-item", help="Specific work item")
def pr(repo, work_item):
    """Create pull requests with evidence."""
    console.print(f"[bold blue]Creating PR:[/bold blue] {repo}")

    try:
        response = httpx.post(
            f"{ORCHESTRATOR_URL}/pr",
            json={"repo_path": repo, "work_item": work_item},
            timeout=60.0
        )
        response.raise_for_status()
        result = response.json()

        console.print(f"[bold green]✓ PR created[/bold green]")
        console.print(f"  URL: {result.get('pr_url')}")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
def merge_train(repo):
    """Execute dependency-ordered merge train."""
    console.print(f"[bold blue]Starting merge train:[/bold blue] {repo}")

    try:
        response = httpx.post(
            f"{ORCHESTRATOR_URL}/merge-train",
            json={"repo_path": repo},
            timeout=600.0
        )
        response.raise_for_status()
        result = response.json()

        console.print(f"[bold green]✓ Merge train complete[/bold green]")
        console.print(f"  Merged: {result.get('merged', 0)}")
        console.print(f"  Failed: {result.get('failed', 0)}")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--repo", required=True, help="Path to repository")
@click.option("--azure-devops", is_flag=True, help="Deploy via Azure DevOps")
def deploy(repo, azure_devops):
    """Deploy to production."""
    console.print(f"[bold blue]Deploying:[/bold blue] {repo}")

    try:
        response = httpx.post(
            f"{ORCHESTRATOR_URL}/deploy",
            json={"repo_path": repo, "azure_devops": azure_devops},
            timeout=600.0
        )
        response.raise_for_status()
        result = response.json()

        console.print(f"[bold green]✓ Deployment complete[/bold green]")
        console.print(f"  Environment: {result.get('environment')}")
        console.print(f"  URL: {result.get('url')}")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


if __name__ == "__main__":
    cli()
