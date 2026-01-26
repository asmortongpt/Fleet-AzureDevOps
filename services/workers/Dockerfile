# Multi-stage build for Celery workers
FROM python:3.11-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy model via pip (compatible with spacy 3.7.2)
RUN pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Production stage
FROM base as production

# Create non-root user with home directory
RUN groupadd -r celery && useradd -r -g celery -m celery

# Copy application code
COPY app/ ./app/

# Set ownership
RUN chown -R celery:celery /app

# Switch to non-root user
USER celery

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD celery -A app.celery_app inspect ping || exit 1

# Default command (can be overridden for specific worker types)
CMD ["celery", "-A", "app.celery_app", "worker", \
     "--loglevel=info", \
     "--concurrency=4", \
     "--max-tasks-per-child=1000", \
     "--time-limit=300", \
     "--soft-time-limit=270"]

# Development stage
FROM base as development

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest==7.4.3 \
    pytest-asyncio==0.21.1 \
    pytest-cov==4.1.0 \
    black==23.11.0 \
    flake8==6.1.0 \
    mypy==1.7.1

COPY app/ ./app/

CMD ["celery", "-A", "app.celery_app", "worker", \
     "--loglevel=debug", \
     "--concurrency=2"]
