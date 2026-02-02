.PHONY: help install dev build run test lint format clean docker-build docker-run docker-stop docker-logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pip install -r requirements.txt

dev: ## Run in development mode with auto-reload
	uvicorn main:socket_app --host 0.0.0.0 --port 8001 --reload

build: ## Build production Docker image
	docker build -t radio-fleet-websocket:latest .

run: ## Run the service locally
	python main.py

test: ## Run tests
	pytest tests/ -v

lint: ## Run linting
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

format: ## Format code with black
	black .

clean: ## Clean up temporary files
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info

docker-build: ## Build Docker image
	docker build -t radio-fleet-websocket:latest .

docker-run: ## Run with docker-compose
	docker-compose up -d

docker-stop: ## Stop docker-compose services
	docker-compose down

docker-logs: ## View docker-compose logs
	docker-compose logs -f websocket

docker-clean: ## Remove docker volumes
	docker-compose down -v

check-env: ## Check if .env file exists
	@test -f .env || (echo "ERROR: .env file not found. Copy .env.example to .env" && exit 1)
	@echo ".env file found"

health: ## Check service health
	@curl -f http://localhost:8001/health || (echo "Service not healthy" && exit 1)

stats: ## Get service statistics
	@curl -s http://localhost:8001/stats | python -m json.tool
