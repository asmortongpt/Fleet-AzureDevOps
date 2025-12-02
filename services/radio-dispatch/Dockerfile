# ==========================================
# Radio Dispatch Service - Production Dockerfile
# ==========================================

FROM python:3.11-slim-bookworm AS base

# Security: Create non-root user
RUN groupadd -r radiodispatch && useradd -r -g radiodispatch -u 1001 radiodispatch

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libsndfile1 \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy English model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY --chown=radiodispatch:radiodispatch ./app ./app
COPY --chown=radiodispatch:radiodispatch ./config ./config

# Security: Run as non-root
USER radiodispatch

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
