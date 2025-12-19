#!/usr/bin/env python3
"""
RAG System for ARCHITECT-PRIME
Provides semantic code search, analysis, and correction validation
"""

import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pathlib import Path
import ast
from typing import List, Dict
import json

class CodeRAGSystem:
    """Retrieval-Augmented Generation system for codebase analysis"""
    
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./chroma_db"
        ))
        
        # Initialize embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create collections
        self.code_collection = self.chroma_client.get_or_create_collection(
            name="codebase",
            metadata={"description": "Fleet codebase embeddings"}
        )
        
        self.findings_collection = self.chroma_client.get_or_create_collection(
            name="findings",
            metadata={"description": "Codebase assessment findings"}
        )
    
    def index_codebase(self):
        """Index all source files for semantic search"""
        print("📚 Indexing codebase...")
        
        file_patterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.py"]
        documents = []
        metadatas = []
        ids = []
        
        for pattern in file_patterns:
            for file_path in self.repo_path.glob(pattern):
                if "node_modules" in str(file_path) or ".git" in str(file_path):
                    continue
                
                try:
                    content = file_path.read_text(encoding='utf-8')
                    rel_path = file_path.relative_to(self.repo_path)
                    
                    # Chunk large files
                    chunks = self._chunk_code(content, max_lines=100)
                    
                    for i, chunk in enumerate(chunks):
                        doc_id = f"{rel_path}:chunk{i}"
                        documents.append(chunk)
                        metadatas.append({
                            "file_path": str(rel_path),
                            "language": file_path.suffix[1:],
                            "chunk_index": i,
                            "total_chunks": len(chunks)
                        })
                        ids.append(doc_id)
                
                except Exception as e:
                    print(f"  ⚠️  Error indexing {file_path}: {e}")
        
        # Add to collection in batches
        batch_size = 1000
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i:i+batch_size]
            batch_metas = metadatas[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]
            
            self.code_collection.add(
                documents=batch_docs,
                metadatas=batch_metas,
                ids=batch_ids
            )
        
        print(f"  ✅ Indexed {len(documents)} code chunks from {len(set([m['file_path'] for m in metadatas]))} files")
    
    def _chunk_code(self, code: str, max_lines: int = 100) -> List[str]:
        """Split code into semantic chunks"""
        lines = code.split('\n')
        chunks = []
        current_chunk = []
        
        for line in lines:
            current_chunk.append(line)
            if len(current_chunk) >= max_lines:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
        
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
        
        return chunks if chunks else [code]
    
    def search_code(self, query: str, n_results: int = 10) -> List[Dict]:
        """Semantic search across codebase"""
        results = self.code_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return [
            {
                "file_path": meta["file_path"],
                "code": doc,
                "language": meta["language"],
                "chunk_index": meta["chunk_index"],
                "score": 1 - dist  # Convert distance to similarity
            }
            for doc, meta, dist in zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            )
        ]
    
    def find_similar_patterns(self, code_snippet: str, threshold: float = 0.8) -> List[Dict]:
        """Find similar code patterns for duplication detection"""
        results = self.code_collection.query(
            query_texts=[code_snippet],
            n_results=50
        )
        
        similar = []
        for doc, meta, dist in zip(results['documents'][0], results['metadatas'][0], results['distances'][0]):
            similarity = 1 - dist
            if similarity >= threshold:
                similar.append({
                    "file_path": meta["file_path"],
                    "code": doc,
                    "similarity": similarity
                })
        
        return similar
    
    def analyze_finding_context(self, finding_id: str, description: str) -> Dict:
        """Get relevant code context for a finding"""
        # Search for relevant code
        code_matches = self.search_code(description, n_results=20)
        
        # Group by file
        files_context = {}
        for match in code_matches:
            file_path = match["file_path"]
            if file_path not in files_context:
                files_context[file_path] = []
            files_context[file_path].append(match)
        
        return {
            "finding_id": finding_id,
            "relevant_files": list(files_context.keys()),
            "code_samples": code_matches[:5],
            "total_matches": len(code_matches)
        }

class StaticAnalyzer:
    """Static code analysis tools"""
    
    @staticmethod
    def analyze_typescript_file(file_path: Path) -> Dict:
        """Analyze TypeScript file for common issues"""
        issues = {
            "any_usage": [],
            "missing_types": [],
            "console_logs": [],
            "todos": [],
            "complexity_warnings": []
        }
        
        try:
            content = file_path.read_text()
            lines = content.split('\n')
            
            for i, line in enumerate(lines, 1):
                # Check for 'any' type
                if ': any' in line or 'as any' in line:
                    issues["any_usage"].append({"line": i, "code": line.strip()})
                
                # Check for console.log
                if 'console.log' in line or 'console.error' in line:
                    issues["console_logs"].append({"line": i, "code": line.strip()})
                
                # Check for TODOs
                if 'TODO' in line or 'FIXME' in line:
                    issues["todos"].append({"line": i, "code": line.strip()})
            
            return issues
        
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def check_strict_mode_compliance(tsconfig_path: Path) -> bool:
        """Check if TypeScript strict mode is enabled"""
        try:
            config = json.loads(tsconfig_path.read_text())
            compiler_options = config.get("compilerOptions", {})
            
            required_strict_options = [
                "strict",
                "noImplicitAny",
                "strictNullChecks",
                "strictFunctionTypes"
            ]
            
            return all(compiler_options.get(opt, False) for opt in required_strict_options)
        
        except Exception:
            return False

