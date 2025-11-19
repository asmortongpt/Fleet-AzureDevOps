# Playwright Runner Service - Visual Testing & UI Automation
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Playwright browsers are already installed in the base image

# Create non-root user for security
RUN groupadd -r playwright && useradd -r -g playwright -u 1001 playwright \
    && chown -R playwright:playwright /app

# Switch to non-root user
USER playwright

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8002/health')"

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
