# test_mcp_clients.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Any
import subprocess
import os


@dataclass
class CommandResult:
    status: str  # "passed" | "failed"
    log: str


class TestRunnerClient:
    """
    Unified runner for shell-based commands.
    Use different wrappers for pytest, Playwright, static analysis, etc.
    """
    def __init__(self, workdir: str) -> None:
        self.workdir = workdir

    def run(self, command: str) -> CommandResult:
        proc = subprocess.run(
            command,
            cwd=self.workdir,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300,
        )
        status = "passed" if proc.returncode == 0 else "failed"
        return CommandResult(status=status, log=proc.stdout + "\n" + proc.stderr)


class XcodeBuildRunnerClient(TestRunnerClient):
    """
    Specialization for Xcode builds.
    """
    def run_build(self, workspace: str, scheme: str, destination: str) -> CommandResult:
        command = f'xcodebuild -workspace "{workspace}" -scheme "{scheme}" -destination "{destination}" build'
        return self.run(command)


class SwiftLintRunnerClient(TestRunnerClient):
    """
    Specialization for Swift static analysis.
    """
    pass
