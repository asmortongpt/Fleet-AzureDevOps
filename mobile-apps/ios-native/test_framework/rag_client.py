# rag_client.py
from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class RAGDocument:
    id: str
    namespace: str
    title: str
    kind: str  # "requirement" | "arch" | "test_run" | ...
    content: str
    metadata: Dict[str, Any]


class RAGClient:
    def search(self, namespace: str, query: str, k: int = 10) -> List[RAGDocument]:
        raise NotImplementedError

    def add_documents(self, docs: List[RAGDocument]) -> None:
        raise NotImplementedError


class InMemoryRAGClient(RAGClient):
    def __init__(self) -> None:
        self._docs: List[RAGDocument] = []

    def search(self, namespace: str, query: str, k: int = 10) -> List[RAGDocument]:
        query = query.lower()
        candidates = [
            d for d in self._docs
            if d.namespace == namespace and query in d.content.lower()
        ]
        return candidates[:k]

    def add_documents(self, docs: List[RAGDocument]) -> None:
        self._docs.extend(docs)
