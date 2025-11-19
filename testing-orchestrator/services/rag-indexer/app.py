"""
RAG Indexer Service - FIXED VERSION
Multi-layer knowledge extraction and indexing for code, architecture, and testing
"""

import os
import sys
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import json

# Add parent directory to path for importing safe file operations
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'api', 'src', 'utils'))
try:
    from safe_file_operations import safe_open_file, validate_path_within_directory, PathTraversalError
except ImportError:
    # Fallback if import fails - define inline
    class PathTraversalError(Exception):
        pass

    def validate_path_within_directory(file_path: str, allowed_directory: str) -> str:
        resolved_allowed_dir = os.path.abspath(allowed_directory)
        if os.path.isabs(file_path):
            resolved_path = os.path.abspath(file_path)
        else:
            resolved_path = os.path.abspath(os.path.join(allowed_directory, file_path))
        try:
            common_path = os.path.commonpath([resolved_allowed_dir, resolved_path])
        except ValueError:
            raise PathTraversalError(file_path, allowed_directory)
        if common_path != resolved_allowed_dir:
            raise PathTraversalError(file_path, allowed_directory)
        if not resolved_path.startswith(resolved_allowed_dir + os.sep) and resolved_path != resolved_allowed_dir:
            raise PathTraversalError(file_path, allowed_directory)
        return resolved_path

    def safe_open_file(file_path: str, allowed_directory: str, mode: str = 'r', encoding: str = 'utf-8', **kwargs):
        validated_path = validate_path_within_directory(file_path, allowed_directory)
        if 'r' in mode and not os.path.exists(validated_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        if 'w' in mode or 'a' in mode:
            parent_dir = os.path.dirname(validated_path)
            os.makedirs(parent_dir, exist_ok=True)
        if 'b' in mode:
            return open(validated_path, mode, **kwargs)
        else:
            return open(validated_path, mode, encoding=encoding, **kwargs)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from openai import AsyncAzureOpenAI
from azure.cosmos.aio import CosmosClient
from azure.search.documents.aio import SearchClient
from azure.search.documents.indexes.aio import SearchIndexClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential
from tree_sitter import Language, Parser
import tree_sitter_python
import tree_sitter_typescript

# ============================================================================
# CONFIGURATION
# ============================================================================

COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
SEARCH_ENDPOINT = os.getenv("SEARCH_ENDPOINT")
SEARCH_KEY = os.getenv("SEARCH_KEY")

# Global client instances (lazy initialization)
_cosmos_client = None
_database_client = None
_openai_client = None
_search_credential = None
_search_index_client = None

# Tree-sitter parsers (can be initialized immediately)
try:
    PY_LANGUAGE = Language(tree_sitter_python.language())
    py_parser = Parser(PY_LANGUAGE)
except Exception as e:
    print(f"Warning: Could not initialize Python parser: {e}")
    py_parser = None

try:
    TS_LANGUAGE = Language(tree_sitter_typescript.language_typescript())
    ts_parser = Parser(TS_LANGUAGE)
except Exception as e:
    print(f"Warning: Could not initialize TypeScript parser: {e}")
    ts_parser = None

# ============================================================================
# CLIENT GETTERS (Lazy Initialization)
# ============================================================================

def get_openai_client() -> AsyncAzureOpenAI:
    """Get or create OpenAI client"""
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY or not OPENAI_ENDPOINT:
            raise ValueError("OPENAI_API_KEY and OPENAI_ENDPOINT must be set")
        _openai_client = AsyncAzureOpenAI(
            api_key=OPENAI_API_KEY,
            azure_endpoint=OPENAI_ENDPOINT,
            api_version="2024-02-01"
        )
    return _openai_client

async def get_cosmos_client():
    """Get or create Cosmos client"""
    global _cosmos_client
    if _cosmos_client is None:
        if not COSMOS_CONNECTION_STRING:
            raise ValueError("COSMOS_CONNECTION_STRING must be set")
        _cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
    return _cosmos_client

async def get_database_client():
    """Get or create database client"""
    global _database_client
    if _database_client is None:
        cosmos = await get_cosmos_client()
        _database_client = cosmos.get_database_client("rag-knowledge")
    return _database_client

def get_search_credential():
    """Get or create search credential"""
    global _search_credential
    if _search_credential is None:
        if not SEARCH_KEY:
            raise ValueError("SEARCH_KEY must be set")
        _search_credential = AzureKeyCredential(SEARCH_KEY)
    return _search_credential

async def get_search_index_client():
    """Get or create search index client"""
    global _search_index_client
    if _search_index_client is None:
        if not SEARCH_ENDPOINT:
            raise ValueError("SEARCH_ENDPOINT must be set")
        _search_index_client = SearchIndexClient(SEARCH_ENDPOINT, get_search_credential())
    return _search_index_client

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(title="RAG Indexer Service", version="1.0.0")

# ============================================================================
# MODELS
# ============================================================================

class CodeFile(BaseModel):
    filepath: str
    content: str
    language: str
    module: Optional[str] = None
    service: Optional[str] = None
    commit_sha: Optional[str] = None

class IndexRequest(BaseModel):
    repository_path: str
    commit_sha: Optional[str] = None
    namespaces: List[str] = [
        "code_files", "code_symbols", "code_components", "code_flows",
        "requirements", "architecture", "test_specs"
    ]

class SearchRequest(BaseModel):
    namespace: str
    query: str
    k: int = 5
    filters: Optional[Dict[str, Any]] = None

# ============================================================================
# RAG NAMESPACES
# ============================================================================

RAG_NAMESPACES = {
    "code_files": "Complete source code files",
    "code_symbols": "Functions, classes, methods extracted from code",
    "code_components": "LLM-generated component summaries",
    "code_flows": "End-to-end flow narratives",
    "requirements": "Requirements and user stories",
    "architecture": "System architecture and design docs",
    "test_specs": "Test plans and specifications",
    "test_runs": "Historical test execution results",
    "defects": "Bug reports and fixes",
    "data_rules": "Data quality and business rules",
    "ui_snapshots": "UI screenshot metadata"
}

# ============================================================================
# CODE ANALYSIS FUNCTIONS
# ============================================================================

def extract_symbols_python(code: str, filepath: str) -> List[Dict[str, Any]]:
    """Extract functions and classes from Python code using tree-sitter"""
    if not py_parser:
        return []

    tree = py_parser.parse(bytes(code, "utf8"))
    symbols = []

    def visit_node(node, parent_class=None):
        if node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            if name_node:
                func_name = code[name_node.start_byte:name_node.end_byte]
                params_node = node.child_by_field_name("parameters")
                params = code[params_node.start_byte:params_node.end_byte] if params_node else "()"

                # Extract docstring
                body = node.child_by_field_name("body")
                docstring = None
                if body and body.children:
                    first_stmt = body.children[0]
                    if first_stmt.type == "expression_statement":
                        expr = first_stmt.children[0]
                        if expr.type == "string":
                            docstring = code[expr.start_byte:expr.end_byte].strip('"""\'\'\'')

                symbol = {
                    "symbol_name": func_name,
                    "symbol_type": "method" if parent_class else "function",
                    "filepath": filepath,
                    "parent_class": parent_class,
                    "signature": f"{func_name}{params}",
                    "docstring": docstring,
                    "start_line": node.start_point[0] + 1,
                    "end_line": node.end_point[0] + 1,
                    "code": code[node.start_byte:node.end_byte]
                }
                symbols.append(symbol)

        elif node.type == "class_definition":
            name_node = node.child_by_field_name("name")
            if name_node:
                class_name = code[name_node.start_byte:name_node.end_byte]
                # Recursively visit methods
                for child in node.children:
                    visit_node(child, class_name)

                # Add class symbol
                symbols.append({
                    "symbol_name": class_name,
                    "symbol_type": "class",
                    "filepath": filepath,
                    "start_line": node.start_point[0] + 1,
                    "end_line": node.end_point[0] + 1
                })

        # Recursively visit children
        for child in node.children:
            if node.type != "class_definition":  # Avoid double-visiting methods
                visit_node(child, parent_class)

    visit_node(tree.root_node)
    return symbols


def extract_symbols_typescript(code: str, filepath: str) -> List[Dict[str, Any]]:
    """Extract functions and classes from TypeScript code"""
    if not ts_parser:
        return []

    tree = ts_parser.parse(bytes(code, "utf8"))
    symbols = []

    def visit_node(node, parent_class=None):
        if node.type in ["function_declaration", "method_definition", "arrow_function"]:
            # Extract function/method details
            name = None
            for child in node.children:
                if child.type == "identifier":
                    name = code[child.start_byte:child.end_byte]
                    break

            if name:
                symbols.append({
                    "symbol_name": name,
                    "symbol_type": "method" if parent_class else "function",
                    "filepath": filepath,
                    "parent_class": parent_class,
                    "start_line": node.start_point[0] + 1,
                    "end_line": node.end_point[0] + 1,
                    "code": code[node.start_byte:node.end_byte]
                })

        elif node.type == "class_declaration":
            name_node = None
            for child in node.children:
                if child.type == "identifier":
                    name_node = child
                    break

            if name_node:
                class_name = code[name_node.start_byte:name_node.end_byte]
                # Visit methods
                for child in node.children:
                    visit_node(child, class_name)

                symbols.append({
                    "symbol_name": class_name,
                    "symbol_type": "class",
                    "filepath": filepath,
                    "start_line": node.start_point[0] + 1,
                    "end_line": node.end_point[0] + 1
                })

        for child in node.children:
            if node.type != "class_declaration":
                visit_node(child, parent_class)

    visit_node(tree.root_node)
    return symbols


async def generate_embedding(text: str) -> List[float]:
    """Generate embeddings using Azure OpenAI"""
    client = get_openai_client()
    response = await client.embeddings.create(
        model="text-embedding-3-large",
        input=text
    )
    return response.data[0].embedding


async def generate_component_summary(files: List[str], symbols: List[Dict]) -> str:
    """Use GPT-4 to generate a component summary"""
    client = get_openai_client()

    prompt = f"""Analyze this code component and provide a concise summary (2-3 paragraphs):

Files: {', '.join(files)}

Key symbols:
{json.dumps([s['symbol_name'] for s in symbols[:20]], indent=2)}

Provide:
1. What this component does (purpose)
2. Key responsibilities
3. Dependencies and relationships
4. Any notable patterns or design decisions
"""

    response = await client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a senior software architect analyzing code."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=500
    )

    return response.choices[0].message.content


async def generate_flow_narrative(flow_name: str, entrypoints: List[str], related_files: List[str]) -> str:
    """Generate end-to-end flow narrative using GPT-4"""
    client = get_openai_client()

    prompt = f"""Describe this application flow in detail:

Flow: {flow_name}
Entrypoints: {', '.join(entrypoints)}
Related files: {', '.join(related_files[:20])}

Provide:
1. Step-by-step description of what happens
2. Services/components involved
3. Key decision points and branches
4. Error handling and edge cases
5. Critical security or data considerations
"""

    response = await client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are analyzing application flows for testing purposes."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=800
    )

    return response.choices[0].message.content

# ============================================================================
# INDEXING FUNCTIONS
# ============================================================================

async def index_code_file(file: CodeFile) -> Dict[str, Any]:
    """Index a single code file"""
    database = await get_database_client()
    container = database.get_container_client("code_files")

    # Generate embedding
    embedding = await generate_embedding(file.content[:8000])  # Limit to avoid token limits

    # Create document
    doc = {
        "id": hashlib.md5(file.filepath.encode()).hexdigest(),
        "partition_key": file.module or "default",
        "filepath": file.filepath,
        "content": file.content,
        "language": file.language,
        "module": file.module,
        "service": file.service,
        "commit_sha": file.commit_sha,
        "indexed_at": datetime.utcnow().isoformat(),
        "embedding": embedding,
        "line_count": len(file.content.split('\n')),
        "char_count": len(file.content)
    }

    # Upsert to Cosmos DB
    await container.upsert_item(doc)

    # Also index in Azure AI Search for vector search
    search_client = SearchClient(SEARCH_ENDPOINT, "code_files", get_search_credential())
    search_doc = {
        "id": doc["id"],
        "filepath": file.filepath,
        "content": file.content[:50000],  # Search has size limits
        "language": file.language,
        "embedding": embedding
    }
    async with search_client:
        await search_client.upload_documents([search_doc])

    return doc


async def index_symbols(filepath: str, code: str, language: str) -> List[Dict[str, Any]]:
    """Extract and index symbols from code"""
    database = await get_database_client()
    container = database.get_container_client("code_symbols")

    # Extract symbols based on language
    if language == "python":
        symbols = extract_symbols_python(code, filepath)
    elif language in ["typescript", "javascript"]:
        symbols = extract_symbols_typescript(code, filepath)
    else:
        return []

    indexed_symbols = []
    for symbol in symbols:
        # Generate embedding for symbol + context
        symbol_text = f"{symbol['symbol_name']} {symbol.get('docstring', '')} {symbol.get('code', '')[:1000]}"
        embedding = await generate_embedding(symbol_text)

        doc = {
            "id": hashlib.md5(f"{filepath}:{symbol['symbol_name']}".encode()).hexdigest(),
            "partition_key": filepath,
            **symbol,
            "embedding": embedding,
            "indexed_at": datetime.utcnow().isoformat()
        }

        await container.upsert_item(doc)
        indexed_symbols.append(doc)

    return indexed_symbols

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "rag-indexer"}


@app.post("/index/file")
async def index_file_endpoint(file: CodeFile):
    """Index a single code file"""
    try:
        doc = await index_code_file(file)
        symbols = await index_symbols(file.filepath, file.content, file.language)

        return {
            "status": "indexed",
            "file_id": doc["id"],
            "symbols_count": len(symbols)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/repository")
async def index_repository(request: IndexRequest, background_tasks: BackgroundTasks):
    """Index an entire repository (background task)"""
    background_tasks.add_task(process_repository_indexing, request)

    return {
        "status": "indexing_started",
        "repository": request.repository_path,
        "namespaces": request.namespaces
    }


async def process_repository_indexing(request: IndexRequest):
    """Background task to index entire repository"""
    import os
    from pathlib import Path

    # SECURITY: Validate repository path to prevent path traversal
    # Define allowed base directory for repositories
    allowed_repos_base = os.getenv('ALLOWED_REPOS_BASE', '/workspace/repos')

    try:
        # Validate that the requested repository path is within the allowed base
        validated_repo_path = validate_path_within_directory(
            request.repository_path,
            allowed_repos_base
        )
        repo_path = Path(validated_repo_path)
    except (PathTraversalError, Exception) as e:
        print(f"❌ Security violation: Invalid repository path '{request.repository_path}': {e}")
        return

    # Walk directory and index files
    for root, dirs, files in os.walk(repo_path):
        # Skip common directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'dist', 'build']]

        for file in files:
            if file.endswith(('.py', '.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                relative_path = os.path.relpath(filepath, repo_path)

                try:
                    # SECURITY: Use safe file read within the validated repository path
                    with safe_open_file(relative_path, str(repo_path), 'r', encoding='utf-8') as f:
                        content = f.read()

                    language = "python" if file.endswith('.py') else "typescript"

                    code_file = CodeFile(
                        filepath=relative_path,
                        content=content,
                        language=language,
                        commit_sha=request.commit_sha
                    )

                    await index_file_endpoint(code_file)
                    print(f"✅ Indexed: {relative_path}")

                except PathTraversalError as e:
                    print(f"❌ Security violation for {relative_path}: {e}")
                except Exception as e:
                    print(f"❌ Failed to index {relative_path}: {e}")


@app.post("/search")
async def search_rag(request: SearchRequest):
    """Search RAG knowledge base"""
    try:
        # Generate query embedding
        query_embedding = await generate_embedding(request.query)

        # Search Azure AI Search with vector query
        search_client = SearchClient(SEARCH_ENDPOINT, request.namespace, get_search_credential())

        vector_query = VectorizedQuery(
            vector=query_embedding,
            k_nearest_neighbors=request.k,
            fields="embedding"
        )

        async with search_client:
            results = search_client.search(
                search_text=request.query,
                vector_queries=[vector_query],
                select=["id", "filepath", "content", "symbol_name", "symbol_type"],
                top=request.k
            )

            result_list = []
            async for result in results:
                result_list.append({
                    "id": result.get("id"),
                    "score": result.get("@search.score"),
                    **{k: v for k, v in result.items() if k not in ["id", "@search.score"]}
                })

        return {"results": result_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
