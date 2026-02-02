.PHONY: help install test clean build run stop logs worker flower

# Default target
help:
	@echo "Radio Fleet Dispatch - Celery Workers"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "Installation:"
	@echo "  make install          Install dependencies"
	@echo "  make install-test     Install test dependencies"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run tests"
	@echo "  make test-cov         Run tests with coverage"
	@echo "  make coverage         Generate coverage report"
	@echo "  make test-transcription  Run transcription worker tests"
	@echo "  make test-nlp         Run NLP worker tests"
	@echo "  make test-policy      Run policy worker tests"
	@echo "  make test-fast        Run tests excluding slow tests"
	@echo "  make clean-test       Clean test artifacts"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             Run linting"
	@echo "  make format           Format code"
	@echo ""
	@echo "Docker Operations:"
	@echo "  make build            Build Docker images"
	@echo "  make run              Start all workers"
	@echo "  make stop             Stop all workers"
	@echo "  make restart          Restart all workers"
	@echo "  make clean            Clean up containers and volumes"
	@echo "  make logs             View worker logs"
	@echo "  make ps               Show running workers"
	@echo "  make scale SVC=<s> N=<n> Scale worker service"
	@echo ""
	@echo "Local Development:"
	@echo "  make worker QUEUE=<q> Run specific worker queue"
	@echo "  make worker-all       Run all workers locally"
	@echo "  make flower           Start Flower monitoring UI"
	@echo "  make beat             Start Celery Beat scheduler"
	@echo "  make shell            Open shell in worker container"
	@echo "  make dev              Run in development mode with auto-reload"

# Install dependencies
install:
	pip install --upgrade pip
	pip install -r requirements.txt
	python -m spacy download en_core_web_sm

# Run tests
test:
	pytest tests/ -v

# Run tests with coverage
test-cov:
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term --cov-report=xml --cov-fail-under=80

# Run tests with coverage report
coverage:
	pytest tests/ --cov=app --cov-report=term-missing --cov-report=html --cov-report=xml
	@echo ""
	@echo "Coverage report generated:"
	@echo "  - HTML: htmlcov/index.html"
	@echo "  - XML: coverage.xml"

# Run specific worker tests
test-transcription:
	pytest tests/test_transcription_worker.py -v

test-nlp:
	pytest tests/test_nlp_worker.py -v

test-policy:
	pytest tests/test_policy_worker.py -v

# Run tests with specific marker
test-unit:
	pytest tests/ -v -m unit

test-integration:
	pytest tests/ -v -m integration

# Run tests excluding slow tests
test-fast:
	pytest tests/ -v -m "not slow"

# Clean test artifacts
clean-test:
	rm -rf .pytest_cache .coverage htmlcov coverage.xml
	find tests/ -type d -name "__pycache__" -exec rm -rf {} +
	find tests/ -type f -name "*.pyc" -delete

# Install test dependencies
install-test:
	pip install -r requirements-test.txt

# Linting
lint:
	flake8 app/
	black --check app/
	mypy app/

# Format code
format:
	black app/
	isort app/

# Clean up
clean:
	docker-compose down -v
	rm -rf __pycache__ .pytest_cache .coverage htmlcov
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Build Docker images
build:
	docker-compose build

# Start all workers
run:
	docker-compose up -d

# Start with Flower monitoring
run-with-flower:
	docker-compose --profile monitoring up -d

# Stop all workers
stop:
	docker-compose down

# Restart all workers
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View specific worker logs
logs-transcription:
	docker-compose logs -f transcription-worker

logs-nlp:
	docker-compose logs -f nlp-worker

logs-policy:
	docker-compose logs -f policy-worker

# Run specific worker queue (local)
worker:
ifndef QUEUE
	@echo "Usage: make worker QUEUE=<queue_name>"
	@echo "Available queues: transcription, nlp, policy, default"
else
	celery -A app.celery_app worker --queues=$(QUEUE) --loglevel=info --concurrency=2
endif

# Run all workers locally
worker-all:
	celery -A app.celery_app worker --loglevel=info --concurrency=4

# Start Flower monitoring UI
flower:
	celery -A app.celery_app flower --port=5555

# Start Flower in Docker
flower-docker:
	docker-compose --profile monitoring up -d flower

# Celery Beat (periodic tasks)
beat:
	celery -A app.celery_app beat --loglevel=info

# Open shell in worker container
shell:
	docker-compose exec transcription-worker /bin/bash

# Show running workers
ps:
	docker-compose ps

# Show Celery worker status
celery-status:
	celery -A app.celery_app inspect ping
	celery -A app.celery_app inspect active_queues
	celery -A app.celery_app inspect stats

# Purge all tasks from queues
purge:
	celery -A app.celery_app purge -f

# Scale worker service
scale:
ifndef SVC
	@echo "Usage: make scale SVC=<service> N=<replicas>"
	@echo "Available services: transcription-worker, nlp-worker, policy-worker"
else
ifndef N
	@echo "Usage: make scale SVC=<service> N=<replicas>"
else
	docker-compose up -d --scale $(SVC)=$(N)
endif
endif

# Development: Watch for code changes and restart
dev:
	watchmedo auto-restart --directory=./app --pattern=*.py --recursive -- \
		celery -A app.celery_app worker --loglevel=debug --concurrency=2

# Production deployment
deploy-prod:
	@echo "Building production image..."
	docker build --target production -t radio-fleet-workers:latest .
	@echo "Pushing to registry..."
	# Add your registry push command here
	@echo "Deploy with Kubernetes/AKS"

# Generate requirements.txt from Pipfile (if using pipenv)
freeze:
	pip freeze > requirements.txt

# Database migrations (if using Alembic)
migrate:
	alembic upgrade head

migrate-rollback:
	alembic downgrade -1

# Check environment variables
check-env:
	@echo "Checking required environment variables..."
	@python -c "from app.config import settings; print('Configuration loaded successfully')"

# Run health check
health:
	celery -A app.celery_app inspect ping
	curl -f http://localhost:5555/ || echo "Flower not running"
