"""
RAG Indexer Service
Multi-layer knowledge extraction and indexing for code, architecture, and testing
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import json

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import openai
from azure.cosmos import CosmosClient, PartitionKey
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
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

# Initialize clients
cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
database = cosmos_client.get_database_client("rag-knowledge")

openai.api_key = OPENAI_API_KEY
openai.api_base = OPENAI_ENDPOINT
openai.api_type = "azure"
openai.api_version = "2024-02-01"

search_credential = AzureKeyCredential(SEARCH_KEY)
search_index_client = SearchIndexClient(SEARCH_ENDPOINT, search_credential)

# Tree-sitter parsers for code analysis
PY_LANGUAGE = Language(tree_sitter_python.language())
TS_LANGUAGE = Language(tree_sitter_typescript.language_typescript())

py_parser = Parser(PY_LANGUAGE)
ts_parser = Parser(TS_LANGUAGE)

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
    response = await openai.Embedding.acreate(
        deployment_id="text-embedding-3-large",
        input=text
    )
    return response['data'][0]['embedding']


async def generate_component_summary(files: List[str], symbols: List[Dict]) -> str:
    """Use GPT-4 to generate a component summary"""
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

    response = await openai.ChatCompletion.acreate(
        deployment_id="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a senior software architect analyzing code."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=500
    )

    return response['choices'][0]['message']['content']


async def generate_flow_narrative(flow_name: str, entrypoints: List[str], related_files: List[str]) -> str:
    """Generate end-to-end flow narrative using GPT-4"""
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

    response = await openai.ChatCompletion.acreate(
        deployment_id="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are analyzing application flows for testing purposes."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=800
    )

    return response['choices'][0]['message']['content']

# ============================================================================
# INDEXING FUNCTIONS
# ============================================================================

async def index_code_file(file: CodeFile) -> Dict[str, Any]:
    """Index a single code file"""
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
    search_client = SearchClient(SEARCH_ENDPOINT, "code_files", search_credential)
    search_doc = {
        "id": doc["id"],
        "filepath": file.filepath,
        "content": file.content[:50000],  # Search has size limits
        "language": file.language,
        "embedding": embedding
    }
    await search_client.upload_documents([search_doc])

    return doc


async def index_symbols(filepath: str, code: str, language: str) -> List[Dict[str, Any]]:
    """Extract and index symbols from code"""
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

    repo_path = Path(request.repository_path)

    # Walk directory and index files
    for root, dirs, files in os.walk(repo_path):
        # Skip common directories
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'dist', 'build']]

        for file in files:
            if file.endswith(('.py', '.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                relative_path = os.path.relpath(filepath, repo_path)

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
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

                except Exception as e:
                    print(f"❌ Failed to index {relative_path}: {e}")


@app.post("/search")
async def search_rag(request: SearchRequest):
    """Search RAG knowledge base"""
    try:
        # Generate query embedding
        query_embedding = await generate_embedding(request.query)

        # Search Azure AI Search with vector query
        search_client = SearchClient(SEARCH_ENDPOINT, request.namespace, search_credential)

        vector_query = VectorizedQuery(
            vector=query_embedding,
            k_nearest_neighbors=request.k,
            fields="embedding"
        )

        results = search_client.search(
            search_text=request.query,
            vector_queries=[vector_query],
            select=["id", "filepath", "content", "symbol_name", "symbol_type"],
            top=request.k
        )

        return {
            "results": [
                {
                    "id": result["id"],
                    "score": result["@search.score"],
                    **{k: v for k, v in result.items() if k not in ["id", "@search.score"]}
                }
                for result in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
