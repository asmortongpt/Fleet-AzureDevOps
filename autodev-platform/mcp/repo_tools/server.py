"""
MCP Server: Repository Tools
Provides filesystem operations, git operations, AST scanning, and dependency graph analysis.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import subprocess
import os
import json
import pathlib
import ast
import re
from datetime import datetime

app = FastAPI(title="MCP Repo Tools", version="1.0.0")

# =============================================================================
# Models
# =============================================================================

class FileOperation(BaseModel):
    path: str
    content: Optional[str] = None
    operation: str  # read, write, delete, exists

class GitOperation(BaseModel):
    repo_path: str
    operation: str  # clone, pull, checkout, branch, commit, status, diff
    args: Optional[Dict[str, Any]] = {}

class ASTScanRequest(BaseModel):
    repo_path: str
    file_patterns: List[str] = ["**/*.py", "**/*.js", "**/*.ts", "**/*.tsx"]

class DependencyGraphRequest(BaseModel):
    repo_path: str
    include_external: bool = False

# =============================================================================
# Health Check
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "mcp-repo-tools",
        "timestamp": datetime.utcnow().isoformat()
    }

# =============================================================================
# Filesystem Operations
# =============================================================================

@app.post("/fs/operation")
async def filesystem_operation(op: FileOperation):
    """Execute filesystem operations."""
    try:
        path = pathlib.Path(op.path)

        if op.operation == "read":
            if not path.exists():
                raise HTTPException(status_code=404, detail=f"File not found: {op.path}")
            return {
                "content": path.read_text(encoding='utf-8'),
                "size": path.stat().st_size,
                "modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat()
            }

        elif op.operation == "write":
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(op.content or "", encoding='utf-8')
            return {"status": "success", "path": str(path)}

        elif op.operation == "delete":
            if path.exists():
                if path.is_dir():
                    import shutil
                    shutil.rmtree(path)
                else:
                    path.unlink()
            return {"status": "deleted", "path": str(path)}

        elif op.operation == "exists":
            return {
                "exists": path.exists(),
                "is_file": path.is_file() if path.exists() else False,
                "is_dir": path.is_dir() if path.exists() else False
            }

        else:
            raise HTTPException(status_code=400, detail=f"Unknown operation: {op.operation}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/fs/list")
async def list_directory(path: str, pattern: str = "*", recursive: bool = False):
    """List files in directory."""
    try:
        directory = pathlib.Path(path)
        if not directory.exists():
            raise HTTPException(status_code=404, detail=f"Directory not found: {path}")

        if recursive:
            files = list(directory.rglob(pattern))
        else:
            files = list(directory.glob(pattern))

        return {
            "files": [
                {
                    "path": str(f),
                    "name": f.name,
                    "is_file": f.is_file(),
                    "is_dir": f.is_dir(),
                    "size": f.stat().st_size if f.is_file() else 0,
                    "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat()
                }
                for f in sorted(files)
            ],
            "total": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Git Operations
# =============================================================================

def run_git_command(repo_path: str, cmd: List[str]) -> Dict[str, Any]:
    """Execute git command and return result."""
    try:
        result = subprocess.run(
            ["git", "-C", repo_path] + cmd,
            capture_output=True,
            text=True,
            check=False
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/git/operation")
async def git_operation(op: GitOperation):
    """Execute git operations."""
    try:
        if op.operation == "clone":
            url = op.args.get("url")
            branch = op.args.get("branch", "main")
            result = subprocess.run(
                ["git", "clone", "-b", branch, url, op.repo_path],
                capture_output=True,
                text=True
            )
            return {"success": result.returncode == 0, "output": result.stdout}

        elif op.operation == "pull":
            return run_git_command(op.repo_path, ["pull", "origin", op.args.get("branch", "main")])

        elif op.operation == "checkout":
            branch = op.args.get("branch")
            create_new = op.args.get("create_new", False)
            cmd = ["checkout", "-b" if create_new else "", branch]
            return run_git_command(op.repo_path, [c for c in cmd if c])

        elif op.operation == "branch":
            result = run_git_command(op.repo_path, ["branch", "--list"])
            branches = [line.strip().replace("* ", "") for line in result["stdout"].split("\n") if line.strip()]
            return {"branches": branches}

        elif op.operation == "status":
            result = run_git_command(op.repo_path, ["status", "--porcelain"])
            return {
                "clean": not result["stdout"],
                "files": result["stdout"].split("\n") if result["stdout"] else []
            }

        elif op.operation == "diff":
            staged = op.args.get("staged", False)
            cmd = ["diff", "--cached"] if staged else ["diff"]
            return run_git_command(op.repo_path, cmd)

        elif op.operation == "commit":
            message = op.args.get("message", "AutoDev commit")
            files = op.args.get("files", ["."])

            # Add files
            for file in files:
                run_git_command(op.repo_path, ["add", file])

            # Commit
            return run_git_command(op.repo_path, ["commit", "-m", message])

        else:
            raise HTTPException(status_code=400, detail=f"Unknown git operation: {op.operation}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# AST Scanning
# =============================================================================

def scan_python_file(file_path: str) -> Dict[str, Any]:
    """Scan Python file and extract AST information."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()

        tree = ast.parse(source, filename=file_path)

        functions = []
        classes = []
        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    "name": node.name,
                    "line": node.lineno,
                    "args": [arg.arg for arg in node.args.args],
                    "is_async": isinstance(node, ast.AsyncFunctionDef),
                    "decorators": [d.id if isinstance(d, ast.Name) else str(d) for d in node.decorator_list]
                })
            elif isinstance(node, ast.ClassDef):
                classes.append({
                    "name": node.name,
                    "line": node.lineno,
                    "bases": [b.id if isinstance(b, ast.Name) else str(b) for b in node.bases],
                    "methods": [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                })
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append({"module": alias.name, "type": "import"})
                else:
                    imports.append({"module": node.module, "type": "from"})

        return {
            "file": file_path,
            "functions": functions,
            "classes": classes,
            "imports": imports,
            "lines": len(source.split("\n"))
        }
    except Exception as e:
        return {"file": file_path, "error": str(e)}

def scan_typescript_file(file_path: str) -> Dict[str, Any]:
    """Scan TypeScript file and extract basic information."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()

        # Simple regex-based extraction (for production, use proper TS parser)
        functions = re.findall(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)', source)
        classes = re.findall(r'(?:export\s+)?class\s+(\w+)', source)
        imports = re.findall(r'import\s+.*?from\s+[\'"](.+?)[\'"]', source)
        interfaces = re.findall(r'(?:export\s+)?interface\s+(\w+)', source)

        return {
            "file": file_path,
            "functions": [{"name": f} for f in functions],
            "classes": [{"name": c} for c in classes],
            "interfaces": [{"name": i} for i in interfaces],
            "imports": [{"module": m} for m in imports],
            "lines": len(source.split("\n"))
        }
    except Exception as e:
        return {"file": file_path, "error": str(e)}

@app.post("/ast/scan")
async def ast_scan(req: ASTScanRequest):
    """Scan repository and extract AST information."""
    try:
        repo_path = pathlib.Path(req.repo_path)
        if not repo_path.exists():
            raise HTTPException(status_code=404, detail=f"Repository not found: {req.repo_path}")

        results = []

        for pattern in req.file_patterns:
            for file_path in repo_path.rglob(pattern.replace("**/", "")):
                if file_path.is_file():
                    if file_path.suffix == ".py":
                        results.append(scan_python_file(str(file_path)))
                    elif file_path.suffix in [".ts", ".tsx", ".js", ".jsx"]:
                        results.append(scan_typescript_file(str(file_path)))

        return {
            "files_scanned": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Dependency Graph
# =============================================================================

@app.post("/dependencies/graph")
async def dependency_graph(req: DependencyGraphRequest):
    """Generate dependency graph from repository."""
    try:
        repo_path = pathlib.Path(req.repo_path)

        # Scan package.json for JavaScript/TypeScript projects
        package_json = repo_path / "package.json"
        if package_json.exists():
            with open(package_json, 'r') as f:
                pkg = json.load(f)

            deps = pkg.get("dependencies", {})
            dev_deps = pkg.get("devDependencies", {})

            return {
                "type": "npm",
                "dependencies": deps,
                "devDependencies": dev_deps,
                "total": len(deps) + len(dev_deps)
            }

        # Scan requirements.txt for Python projects
        requirements = repo_path / "requirements.txt"
        if requirements.exists():
            with open(requirements, 'r') as f:
                deps = [line.strip() for line in f if line.strip() and not line.startswith("#")]

            return {
                "type": "pip",
                "dependencies": deps,
                "total": len(deps)
            }

        return {
            "type": "unknown",
            "dependencies": [],
            "total": 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# Code Search
# =============================================================================

@app.get("/search/code")
async def search_code(repo_path: str, pattern: str, file_types: str = "py,js,ts,tsx"):
    """Search for code patterns in repository."""
    try:
        repo = pathlib.Path(repo_path)
        file_exts = [f".{ext}" for ext in file_types.split(",")]

        results = []
        for file_path in repo.rglob("*"):
            if file_path.is_file() and file_path.suffix in file_exts:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    matches = []
                    for i, line in enumerate(content.split("\n"), 1):
                        if re.search(pattern, line):
                            matches.append({"line": i, "content": line.strip()})

                    if matches:
                        results.append({
                            "file": str(file_path.relative_to(repo)),
                            "matches": matches[:10]  # Limit to 10 matches per file
                        })
                except Exception:
                    continue

        return {
            "pattern": pattern,
            "files_found": len(results),
            "results": results[:50]  # Limit to 50 files
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
