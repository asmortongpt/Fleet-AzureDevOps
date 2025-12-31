.PHONY: dev test lint seed clean build deploy-local deploy-aks

# Local development
dev:
	docker compose up --build

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

# Testing
test:
	docker compose -f docker-compose.test.yml up --abort-on-container-exit
	pytest tests/

test-integration:
	pytest tests/integration/ -v

test-load:
	k6 run tests/load/api_load_test.js

# Linting and formatting
lint:
	cd services/api && ruff check . && black --check .
	cd services/workers && ruff check . && black --check .
	cd frontend && npm run lint

format:
	cd services/api && ruff check --fix . && black .
	cd services/workers && ruff check --fix . && black .
	cd frontend && npm run format

# Database
migrate:
	cd services/api && alembic upgrade head

migrate-down:
	cd services/api && alembic downgrade -1

seed:
	python scripts/seed.sh

# Build
build:
	docker compose build

build-prod:
	cd frontend && npm run build
	docker build -t radio-fleet-api:latest -f services/api/Dockerfile services/api
	docker build -t radio-fleet-workers:latest -f services/workers/Dockerfile services/workers
	docker build -t radio-fleet-websocket:latest -f services/websocket/Dockerfile services/websocket
	docker build -t radio-fleet-frontend:latest -f frontend/Dockerfile frontend

# Infrastructure
infra-plan:
	cd infra/terraform && terraform plan

infra-apply:
	cd infra/terraform && terraform apply

infra-destroy:
	cd infra/terraform && terraform destroy

# Kubernetes
deploy-local:
	helm upgrade --install radio-fleet infra/helm/radio-fleet -f infra/helm/radio-fleet/values.dev.yaml

deploy-aks:
	./scripts/deploy_aks.sh

# Cleanup
clean:
	docker compose down -v
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf frontend/.next
	rm -rf frontend/out

# Simulators
sim-radio:
	python simulators/radio_simulator.py

sim-gps:
	python simulators/gps_simulator.py

# Help
help:
	@echo "Available targets:"
	@echo "  dev              - Start local development environment"
	@echo "  test             - Run all tests"
	@echo "  lint             - Run linters"
	@echo "  seed             - Seed database with sample data"
	@echo "  migrate          - Run database migrations"
	@echo "  build-prod       - Build production images"
	@echo "  deploy-aks       - Deploy to Azure Kubernetes Service"
	@echo "  sim-radio        - Run radio transmission simulator"
	@echo "  sim-gps          - Run GPS position simulator"
