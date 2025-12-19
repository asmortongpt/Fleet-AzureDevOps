# RAG Indexer Service - Multi-layer Knowledge Extraction
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install tree-sitter language bindings
RUN python -c "import tree_sitter_python; import tree_sitter_typescript"

# Copy application code
COPY app.py .

# Create non-root user for security
RUN groupadd -r ragindexer && useradd -r -g ragindexer -u 1001 ragindexer \
    && chown -R ragindexer:ragindexer /app

# Switch to non-root user
USER ragindexer

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
